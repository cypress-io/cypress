// chai directly rather than lib/system-tests: this spec drives real processes itself
// and needs none of systemTests.it's spawn/snapshot machinery or its global setup.
import { expect } from 'chai'
import path from 'path'
import stripAnsi from 'strip-ansi'
import { openTapInstance, openTapInstanceViaModuleApi, tapWithoutInstance } from '../lib/tap-open'
import type { TapInstance } from '../lib/tap-open'

const SPEC = 'cypress/e2e/aut-content.cy.js'
const SLOW_SPEC = 'cypress/e2e/slow.cy.js'
const FAILING_SPEC = 'cypress/e2e/failing.cy.js'
const PIN_SPEC = 'cypress/e2e/pin-target.cy.js'

const STATUS_DIV = '<div id="status" data-cy="status">ready</div>'

// Booting open mode, launching a browser, and running specs all take real time.
const SUITE_TIMEOUT_MS = 360000

/** Failures render as `CODE: message` on stderr, so the code is the stable assertion. */
const failureOutput = (result: { stdout: string, stderr: string }) => `${result.stdout}${result.stderr}`

/**
 * Snapshots the human-readable rendering, which is what a person actually reads and the
 * only output `--json` never exercises. Scrubs the parts that legitimately differ per
 * run — the scaffolded project path, the server port, and durations — so a snapshot
 * failure means the rendering changed, not the environment.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const snapshot = require('snap-shot-it')

const snapshotRendering = (name: string, text: string, extra: Array<[RegExp, string]> = []): void => {
  // The patched snap-shot-core resolves the snapshot file from this global (see
  // patches/snap-shot-core*), but still creates the directory relative to the real
  // process.cwd() — so the two only agree when this equals the cwd the runner uses,
  // the workspace root. That is what `systemTests.snapshot` sets, and setting it any
  // deeper makes the write fail with ENOENT.
  const globals = global as unknown as { CACHED_CWD_FOR_SNAP_SHOT_IT: string }

  globals.CACHED_CWD_FOR_SNAP_SHOT_IT = path.join(__dirname, '..')

  let normalized = stripAnsi(text)
  .replace(/[\w./-]*cy-projects\/tap-retries/g, '<project>')
  .replace(/localhost:\d+/g, 'localhost:<port>')
  .replace(/\b\d+(\.\d+)?ms\b/g, '<ms>')
  // The whole parenthetical, not just the clock digits: the label carries a meridiem
  // (and would carry a different shape under another locale or a 24-hour clock), so
  // scrubbing only the digits leaves an AM/PM that flips with the time of day.
  .replace(/\(started at [^)]*\)/g, '(started at <time>)')
  .replace(/\b\d{1,2}:\d{2}:\d{2}(\.\d+)?\b/g, '<time>')

  for (const [pattern, replacement] of extra) {
    normalized = normalized.replace(pattern, replacement)
  }

  snapshot(name, normalized.trimEnd())
}

/**
 * The only coverage that drives the real `cypress tap` CLI end to end: a real
 * `cypress open` instance, discovered through its own record and liveness probe, read
 * over its own browser's CDP connection. Everything the cypress-in-cypress specs have
 * to bypass is exercised here — argument parsing, discovery failures, the
 * run-lifecycle gate, unshadowed AUT frame resolution, the renderers, and exit codes.
 *
 * Reads are asserted through `--json` rather than the human rendering: the result
 * contract is stable, the prose is not, and `--json` still goes through renderOutcome.
 */
describe('tap CLI with no running instance', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  it('reports "not connected" from status, and exits 0', async () => {
    // status always exits 0 for a determinable stage, so a poller can branch on the
    // field instead of on the exit code.
    const result = await tapWithoutInstance(['--json', 'status'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.eq({ status: 'not connected' })
  })

  it('exits 1 with NO_INSTANCE for a read', async () => {
    const result = await tapWithoutInstance(['dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('NO_INSTANCE')
  })

  it('names the pid that was asked for when --instance matches nothing', async () => {
    const result = await tapWithoutInstance(['--instance', '999999', 'inspect', '--selector', '#status'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('NO_INSTANCE')
    expect(failureOutput(result)).to.include('999999')
  })
})

describe('tap CLI before any spec has run', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance

  before(async () => {
    instance = await openTapInstance('tap-retries')
  })

  after(async () => {
    await instance?.kill()
  })

  it('reports a connected instance with no spec selected', async () => {
    const status = await instance.status()

    expect(status.status).to.eq('spec not selected')
  })

  it('lists the project’s specs', async () => {
    const result = await instance.tap(['--json', 'specs'])

    expect(result.exitCode).to.eq(0)
    expect(JSON.stringify(result.json())).to.include('aut-content.cy.js')
  })

  it('exits non-zero when asked to run a spec that does not exist', async () => {
    const result = await instance.tap(['run', 'cypress/e2e/not-a-real-spec.cy.js'])

    expect(result.exitCode).to.not.eq(0)
  })

  it('exits 1 with NO_RUN for an AUT read', async () => {
    // Short of a verdict there is no run to read: the resolved frame would be the
    // runner shell, so the read is refused rather than returning a misleading page.
    const result = await instance.tap(['dom'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('NO_RUN')
  })
})

describe('tap CLI against a settled run', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance

  before(async () => {
    instance = await openTapInstance('tap-retries')
    await instance.runSpec(SPEC)
  })

  after(async () => {
    await instance?.kill()
  })

  it('reports a settled run through the status lifecycle', async () => {
    const status = await instance.status()

    expect(status.status).to.eq('passed')
    expect(status.startedAt, 'the run every other field describes').to.be.a('string')
  })

  it('lists the instance it is attached to', async () => {
    const result = await instance.tap(['--json', 'instances'])

    expect(result.exitCode).to.eq(0)
    expect(JSON.stringify(result.json())).to.include('tap-retries')
  })

  it('reads the app-under-test DOM by selector', async () => {
    const result = await instance.tap(['--json', 'dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.include({ found: true, html: STATUS_DIV })
  })

  it('reads the whole app-under-test DOM', async () => {
    const result = await instance.tap(['--json', 'dom'])

    expect(result.exitCode).to.eq(0)
    // `include`, not an equality: the proxy injects into the AUT document.
    expect(result.json().html).to.include('<h1>Tap fixture</h1>')
    expect(result.json()).to.not.have.property('found')
  })

  it('renders a DOM read for humans', async () => {
    const result = await instance.tap(['dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(0)
    expect(result.stdout).to.include(STATUS_DIV)

    snapshotRendering('dom by selector', result.stdout)
  })

  it('tells a human when a read was clipped', async () => {
    const result = await instance.tap(['dom', '--max-chars', '120'])

    expect(result.exitCode).to.eq(0)
    // Deliberately not snapshotted: at any cap the whole-page read starts with the
    // proxy's injected script, so a snapshot would track that injection rather than
    // this rendering. The truncation notice is the part worth asserting.
    expect(result.stdout).to.include('truncated')
  })

  it('renders the ambiguity answer for humans', async () => {
    const result = await instance.tap(['dom', '--selector', '.item'])

    expect(result.exitCode, 'the read never happened').to.eq(1)
    snapshotRendering('dom ambiguous selector', result.stdout)
  })

  it('renders the accessibility subtree for humans', async () => {
    // Rooted at the panel: the whole-frame tree carries browser-version-dependent
    // nodes, while this subtree is entirely the fixture's own markup.
    const result = await instance.tap(['aria', '--selector', '#panel'])

    expect(result.exitCode).to.eq(0)
    snapshotRendering('aria subtree', result.stdout)
  })

  it('renders a failure for humans', async () => {
    const result = await instance.tap(['dom', '--selector', '#status['])

    expect(result.exitCode).to.eq(1)
    expect(result.stdout, 'failures go to stderr').to.eq('')

    snapshotRendering('dom invalid selector', result.stderr)
  })

  it('renders status for humans', async () => {
    // The richest human rendering: the instance columns, then the phase line, then the
    // counts. Once a spec is selected the phase is carried by the icon rather than
    // spelled out, so there is no word to substring-match — which is exactly why this
    // one is worth snapshotting.
    const payload = await instance.status()
    const result = await instance.tap(['status'])

    expect(result.exitCode).to.eq(0)

    // Scrub the pid with the value the JSON payload reports, rather than a digit pattern
    // that could also match the run counts.
    snapshotRendering('status', result.stdout, [
      [new RegExp(String(payload.pid), 'g'), '<pid>'],
      // The instance table pads PROJECT to the width of the longest value, so the
      // column width tracks the scaffolded tmp path — which differs between a local
      // run and CI. Collapse space runs: column order and content stay asserted,
      // alignment (the part that legitimately varies) does not.
      [/ {2,}/g, '  '],
    ])
  })

  it('clips a read at --max-chars', async () => {
    const result = await instance.tap(['--json', 'dom', '--max-chars', '20'])

    expect(result.exitCode).to.eq(0)
    expect(result.json().truncated, 'the browser-side cap clipped the output').to.eq(true)
    expect(result.json().html).to.have.length(20)
  })

  it('accepts the short option aliases', async () => {
    // -s/-m for a native command, and the same read via the long forms, so the aliases
    // are proven equivalent rather than merely accepted.
    const short = await instance.tap(['--json', 'dom', '-s', '#status', '-m', '30000'])
    const long = await instance.tap(['--json', 'dom', '--selector', '#status', '--max-chars', '30000'])

    expect(short.exitCode).to.eq(0)
    expect(short.json()).to.deep.eq(long.json())
  })

  it('reports a selector that matches nothing as an answer, not a failure', async () => {
    const result = await instance.tap(['--json', 'dom', '--selector', '.not-in-the-fixture'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.eq({ found: false })
  })

  it('exits 1 and names the matches for an ambiguous selector', async () => {
    const result = await instance.tap(['--json', 'dom', '--selector', '.item'])

    // The ambiguity answer prints on stdout like any result, but it is not the read
    // that was asked for, so the exit code has to say so.
    expect(result.exitCode).to.eq(1)

    const outcome = result.json()

    expect(outcome).to.deep.include({ ambiguous: true, selector: '.item', count: 3 })

    // Unlike cypress-in-cypress, the binding here is the instance's own, so the
    // disambiguating selectors are really derived.
    expect(outcome.selectors).to.have.length(3)
  })

  it('indexes into an ambiguous selector with --at', async () => {
    const result = await instance.tap(['--json', 'dom', '--selector', '.item', '--at', '1'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.include({ found: true, html: '<li class="item">Item 2</li>' })
  })

  it('exits 1 with the valid range for an out-of-range --at', async () => {
    const result = await instance.tap(['dom', '--selector', '.item', '--at', '3'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('pass --at 0-2')
  })

  it('exits 1 when --at is given without a selector to index into', async () => {
    const result = await instance.tap(['dom', '--at', '1'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('INVALID_INDEX')
  })

  it('exits 1 for an invalid selector', async () => {
    const result = await instance.tap(['dom', '--selector', '#status['])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('is not a valid CSS selector')
  })

  it('projects the accessibility tree', async () => {
    const result = await instance.tap(['--json', 'aria'])

    expect(result.exitCode).to.eq(0)

    const outcome = result.json()
    const roles = outcome.nodes.map((node: { role: string }) => node.role)

    expect(outcome.nodes[0]).to.include({ depth: 0, role: 'RootWebArea' })
    expect(outcome.nodeCount).to.eq(outcome.nodes.length)
    expect(roles).to.include.members(['heading', 'region', 'button', 'textbox', 'checkbox'])

    // aria projects structural and text roles away.
    expect(roles).to.not.include.members(['StaticText', 'generic', 'InlineTextBox'])
  })

  it('roots the accessibility tree at a selector', async () => {
    const result = await instance.tap(['--json', 'aria', '--selector', '#panel'])

    expect(result.exitCode).to.eq(0)

    const outcome = result.json()
    const roles = outcome.nodes.map((node: { role: string }) => node.role)

    // Depths are relative to the subtree, so the region is its root.
    expect(outcome.nodes[0]).to.include({ depth: 0, role: 'region', name: 'Controls' })
    expect(roles, 'the document root is outside the subtree').to.not.include('RootWebArea')
    expect(roles, 'the heading is outside the subtree').to.not.include('heading')
    expect(roles).to.include('button')
  })

  it('clips the accessibility tree at --max-nodes', async () => {
    const result = await instance.tap(['--json', 'aria', '--max-nodes', '2'])

    expect(result.exitCode).to.eq(0)
    expect(result.json().nodes).to.have.length(2)
    expect(result.json().truncated, 'the node cap clipped the tree').to.eq(true)
  })

  it('inspects an element', async () => {
    const result = await instance.tap(['--json', 'inspect', '--selector', '#status'])

    expect(result.exitCode).to.eq(0)

    const outcome = result.json()

    expect(outcome).to.deep.include({ selector: '#status', found: true, tag: 'div' })
    expect(outcome.attributes).to.deep.eq({ 'id': 'status', 'data-cy': 'status' })
    expect(outcome.styles).to.include({ 'color': 'rgb(0, 100, 0)', 'font-size': '16px' })
    expect(outcome.box).to.include({ width: 200, height: 24 })
  })

  it('reports a disabled control’s accessibility state', async () => {
    const result = await instance.tap(['--json', 'inspect', '--selector', '#locked'])

    expect(result.exitCode).to.eq(0)
    expect(result.json().aria).to.deep.include({ role: 'button', name: 'Locked' })
    expect(result.json().aria.states).to.include('disabled')
  })

  it('reports an element that matched nothing', async () => {
    const result = await instance.tap(['--json', 'inspect', '--selector', '#missing'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.eq({ selector: '#missing', found: false })
  })
})

// These run in declaration order against one instance: the run gate has to be observed
// mid-run, before anything settles.
describe('tap CLI across the run lifecycle', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance
  let firstStartedAt: string | null | undefined

  before(async () => {
    instance = await openTapInstance('tap-retries')
  })

  after(async () => {
    await instance?.kill()
  })

  it('exits 1 with RUN_IN_PROGRESS while a spec is still running', async () => {
    await instance.requestRun(SLOW_SPEC)

    // `running` is the only stage the reads reject as in-progress; `loading` is still
    // short of a run of its own and reports NO_RUN.
    await instance.waitForStatus((status) => status.status === 'running', 'the running stage')

    const result = await instance.tap(['dom'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('RUN_IN_PROGRESS')
  })

  it('becomes readable once that run settles', async () => {
    const settled = await instance.waitForStatus(
      (status) => status.status === 'passed' || status.status === 'failed',
      'a verdict',
    )

    expect(settled.status).to.eq('passed')
    firstStartedAt = settled.startedAt

    const result = await instance.tap(['--json', 'dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.include({ found: true, html: STATUS_DIV })
  })

  it('starts a new run on rerun, with its own startedAt', async () => {
    // A rerun leaves the previous verdict readable until the incoming run starts, so
    // startedAt is the only way to tell which run a verdict describes.
    const settled = await instance.runSpec(SLOW_SPEC)

    expect(settled.status).to.eq('passed')
    expect(settled.startedAt).to.be.a('string')
    expect(settled.startedAt).to.not.eq(firstStartedAt)
  })

  it('keeps the app under test readable after a failing run', async () => {
    const settled = await instance.runSpec(FAILING_SPEC)

    expect(settled.status).to.eq('failed')

    // A failed verdict is still a settled run, so the read is allowed.
    const result = await instance.tap(['--json', 'dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.include({ found: true, html: STATUS_DIV })
  })

  it('exits 1 with NO_INSTANCE once the instance is gone', async () => {
    // SIGKILL skips the record cleanup an orderly exit would run, so the record outlives
    // its writer. Discovery reaps it on the next read (`reapIfDead` in
    // cypress-instances/store.ts), so an unclean exit reports NO_INSTANCE rather than
    // STALE_INSTANCE — the latter needs a pid that is alive but no longer answering.
    await instance.terminate()

    const result = await instance.tap(['dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('NO_INSTANCE')
  })
})

/**
 * The same instance, booted through the documented Module API (`cypress.open()`) rather
 * than by spawning the CLI. This is the entry a user or agent scripting Cypress
 * programmatically would reach for, and nothing else proves a Module-API-booted
 * instance is discoverable by tap — `cli/test/lib/exec/open.spec.ts` stops at asserting
 * the argv it builds, with spawn stubbed.
 *
 * Assertions are a deliberate subset: the read surface is already covered above against
 * the spawned instance, so what is worth proving here is that the boot path produces an
 * instance tap can find, gate on, and read. See `openTapInstanceViaModuleApi` for what
 * this boot path costs a test harness.
 */
describe('tap CLI against a Module-API-booted instance', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance

  before(async () => {
    instance = await openTapInstanceViaModuleApi('tap-retries')
    await instance.runSpec(SPEC)
  })

  after(async () => {
    await instance?.kill()
  })

  it('is discoverable, with a settled run', async () => {
    const status = await instance.status()

    expect(status.status).to.eq('passed')
    expect(status.startedAt).to.be.a('string')
  })

  it('reads the app-under-test DOM by selector', async () => {
    const result = await instance.tap(['--json', 'dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.include({ found: true, html: STATUS_DIV })
  })

  it('projects the accessibility tree', async () => {
    const result = await instance.tap(['--json', 'aria'])

    expect(result.exitCode).to.eq(0)
    expect(result.json().nodes[0]).to.include({ depth: 0, role: 'RootWebArea' })
  })

  it('still exits 1 for an ambiguous selector', async () => {
    const result = await instance.tap(['--json', 'dom', '--selector', '.item'])

    expect(result.exitCode).to.eq(1)
    expect(result.json()).to.deep.include({ ambiguous: true, count: 3 })
  })
})

/**
 * `cli/lib/tap/AGENTS.md` requires help text to describe *what* a command does and never
 * how it gets there — no CDP protocol details, find-instance mechanism, or in-browser
 * binding internals. Nothing enforced that rule until now; it is easy to reintroduce
 * while documenting a new option.
 *
 * The command list is read back out of the top-level help, so a command added later is
 * covered without touching this test.
 */
describe('tap CLI help text', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  const BANNED = [
    /\bCDP\b/i,
    /isolated world/i,
    /tap binding/i,
    /liveness probe/i,
    /backend node/i,
    /chrome-remote-interface/i,
    /websocket/i,
    /callFunctionOn/,
    /createIsolatedWorld/,
  ]

  const helpFor = async (command: string[]) => {
    const result = await tapWithoutInstance([...command, '--help'])

    expect(result.exitCode, `tap ${command.join(' ')} --help should succeed`).to.eq(0)

    return result.stdout
  }

  it('documents every command without leaking internals', async () => {
    const root = await helpFor([])

    // The "Commands:" section lists one command per entry, indented by two spaces.
    const names = root
    .slice(root.indexOf('Commands:'))
    .split('\n')
    .map((line) => /^ {2}([a-z][a-z-]*)/.exec(line)?.[1])
    .filter((name): name is string => Boolean(name))

    expect(names, 'commands parsed out of the root help').to.include.members([
      'instances', 'status', 'specs', 'run', 'dom', 'aria', 'inspect', 'command', 'reporter', 'pin',
    ])

    for (const text of [root, ...await Promise.all(names.map((name) => helpFor([name])))]) {
      for (const banned of BANNED) {
        expect(banned.test(text), `help must not mention ${banned} — see cli/lib/tap/AGENTS.md:\n${text}`).to.eq(false)
      }
    }
  })

  it('exits non-zero for an unknown command', async () => {
    const result = await tapWithoutInstance(['not-a-command'])

    expect(result.exitCode).to.not.eq(0)
  })
})

/**
 * Pinning is the one read that does not target the live app: it restores a command's
 * recorded DOM snapshot into the AUT frame, and the reads then see *that*. The fixture
 * clicks a button that rewrites #status, so the pinned "before" snapshot and the live
 * page differ — which is the only way to prove a read followed the pin.
 *
 * This is also the only coverage of the binding-routed subcommands (`reporter`,
 * `command`, `pin`) through the CLI rather than through the in-browser binding.
 */
describe('tap CLI reading a pinned snapshot', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance
  let testId: string
  let clickCommandId: string

  before(async () => {
    instance = await openTapInstance('tap-retries')
    await instance.runSpec(PIN_SPEC)

    // The fixture's test sits inside a describe, so it is reported under `suites`.
    const overview = (await instance.tap(['--json', 'reporter'])).json()
    const tests = [...overview.tests, ...overview.suites.flatMap((suite: { tests: unknown[] }) => suite.tests)]

    testId = (tests[0] as { id: string }).id

    const log = (await instance.tap(['--json', 'reporter', '--test-id', testId])).json()

    clickCommandId = log.commands.find((entry: { name: string }) => entry.name === 'click').id
  })

  after(async () => {
    await instance?.kill()
  })

  it('reports the spec overview and a test’s command log', async () => {
    const overview = (await instance.tap(['--json', 'reporter'])).json()

    expect(overview.spec).to.include('pin-target.cy.js')
    expect(overview.stats).to.include({ passed: 1, failed: 0 })

    const log = (await instance.tap(['--json', 'reporter', '--test-id', testId])).json()

    expect(log.commands.map((entry: { name: string }) => entry.name)).to.include.members(['visit', 'get', 'click', 'assert'])
  })

  it('details one command, including the snapshots pinnable on it', async () => {
    const result = await instance.tap(['--json', 'command', '--test-id', testId, '--command-id', clickCommandId])

    expect(result.exitCode).to.eq(0)

    const detail = result.json()

    expect(detail).to.deep.include({ id: clickCommandId, name: 'click', state: 'passed' })
    expect(detail.snapshots.map((snapshot: { name: string }) => snapshot.name)).to.deep.eq(['before', 'after'])
    expect(detail.consoleProps, 'the command’s console output').to.exist
  })

  it('exits 1 when --command-id is given without the test it belongs to', async () => {
    const result = await instance.tap(['command', '--command-id', clickCommandId])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('--test-id')
  })

  it('reads the pinned snapshot rather than the live page', async () => {
    // The click already ran, so the live page holds the post-click DOM.
    const live = (await instance.tap(['--json', 'dom', '--selector', '#status'])).json()

    expect(live.html).to.eq('<div id="status">clicked</div>')

    const pin = await instance.tap(['--json', 'pin', '--test-id', testId, '--command-id', clickCommandId, '--at', 'before'])

    expect(pin.exitCode).to.eq(0)
    expect(pin.json().pinned).to.deep.include({ test: testId })
    expect(pin.json().pinned.at).to.deep.include({ name: 'before', index: 1, total: 2 })

    // The read now resolves the restored snapshot, which predates the click.
    const pinned = (await instance.tap(['--json', 'dom', '--selector', '#status'])).json()

    expect(pinned.html, 'the pre-click snapshot').to.eq('<div id="status">ready</div>')

    // status carries the pin, so a poller can tell it is not looking at the live app.
    const status = await instance.status()

    expect(status.pinned).to.deep.include({ test: testId })
  })

  it('restores the live app on --clear', async () => {
    const cleared = await instance.tap(['pin', '--clear'])

    expect(cleared.exitCode).to.eq(0)

    const live = (await instance.tap(['--json', 'dom', '--selector', '#status'])).json()

    expect(live.html, 'the live post-click page').to.eq('<div id="status">clicked</div>')

    const status = await instance.status()

    expect(status.pinned, 'no pin is reported once cleared').to.be.undefined
  })
})
