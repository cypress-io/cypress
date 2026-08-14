// chai directly rather than lib/system-tests: this spec drives real processes itself
// and needs none of systemTests.it's spawn/snapshot machinery or its global setup.
import { expect } from 'chai'
import path from 'path'
import stripAnsi from 'strip-ansi'
import { TAP_ERROR_COPY } from '@packages/cypress-instances'
import type { TapErrorCopy } from '@packages/cypress-instances'
import { openTapInstance, openTapInstanceViaModuleApi, tapWithoutInstance } from '../lib/tap-open'
import type { TapInstance } from '../lib/tap-open'

const SPEC = 'cypress/e2e/aut-content.cy.js'
const SLOW_SPEC = 'cypress/e2e/slow.cy.js'
const FAILING_SPEC = 'cypress/e2e/failing.cy.js'
const PIN_SPEC = 'cypress/e2e/pin-target.cy.js'

const STATUS_DIV = '<div id="status" data-cy="status">ready</div>'

const SUITE_TIMEOUT_MS = 360000

const failureOutput = (result: { stdout: string, stderr: string }) => `${result.stdout}${result.stderr}`

// Failures render the registry copy on stderr and never print the code, so the
// entry's description — with the backticks the CLI renders as colour stripped —
// is the stable assertion.
const copyFor = (code: keyof typeof TAP_ERROR_COPY): string => {
  return (TAP_ERROR_COPY[code] as TapErrorCopy).description!.replace(/`/g, '')
}

/**
 * Snapshots human-readable output after scrubbing paths, ports, and timing so failures
 * represent rendering changes rather than environment differences.
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

  // `layout` can leave column padding behind ANSI resets, so trim after stripping them.
  let normalized = stripAnsi(text)
  .split('\n')
  .map((line) => line.trimEnd())
  .join('\n')
  .replace(/[\w./-]*cy-projects\/tap-retries/g, '<project>')
  .replace(/localhost:\d+/g, 'localhost:<port>')
  // Duration units vary by magnitude, so normalize every shape to one token.
  .replace(/\b\d+(\.\d+)?m?s\b/g, '<duration>')
  // The whole parenthetical, not just the clock digits: the label carries a meridiem
  // (and would carry a different shape under another locale or a 24-hour clock), so
  // scrubbing only the digits leaves an AM/PM that flips with the time of day.
  .replace(/\(started at [^)]*\)/g, '(started at <time>)')
  .replace(/\b\d{1,2}:\d{2}:\d{2}(\.\d+)?\b/g, '<time>')
  // mm:ss only; colons on either side identify a file:line:column location.
  .replace(/(?<!:)\b\d{2}:\d{2}\b(?!:)/g, '<duration>')

  for (const [pattern, replacement] of extra) {
    normalized = normalized.replace(pattern, replacement)
  }

  snapshot(name, normalized.trimEnd())
}

/**
 * Drives the real `cypress tap` CLI against a real open-mode instance. JSON assertions
 * cover the stable result contract; snapshots cover selected human renderings.
 */
describe('tap CLI with no running instance', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  it('reports "not connected" from status, and exits 0', async () => {
    const result = await tapWithoutInstance(['--json', 'status'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.eq({ status: 'not connected' })
  })

  it('exits 1 with NO_INSTANCE for a read', async () => {
    const result = await tapWithoutInstance(['dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include(copyFor('NO_INSTANCE'))
  })

  it('names the pid that was asked for when --instance matches nothing', async () => {
    const result = await tapWithoutInstance(['--instance', '999999', 'inspect', '--selector', '#status'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include(copyFor('INSTANCE_NOT_FOUND'))
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

  it('exits 1 with SPEC_NOT_STARTED for an AUT read', async () => {
    // Short of a verdict there is no run to read: the resolved frame would be the
    // runner shell, so the read is refused rather than returning a misleading page.
    const result = await instance.tap(['dom'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include(copyFor('SPEC_NOT_STARTED'))
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

  it('reads the app-under-test body when no selector is given', async () => {
    const result = await instance.tap(['--json', 'dom'])

    expect(result.exitCode).to.eq(0)
    expect(result.json().found).to.eq(true)
    // `include`, not an equality: the proxy injects into the AUT document.
    expect(result.json().html).to.include('<h1>Tap fixture</h1>')
    expect(result.json().html, 'the default read is rooted at the body').to.match(/^<body[\s>]/)
  })

  it('reads the whole document with --selector html', async () => {
    const result = await instance.tap(['--json', 'dom', '--selector', 'html'])

    expect(result.exitCode).to.eq(0)
    expect(result.json().html).to.include('<title>Tap AUT content</title>')
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
    // Deliberately not snapshotted: a cap this low cuts the markup mid-tag, so a
    // snapshot would pin whichever attribute the browser happened to serialize
    // first. The truncation notice is the part worth asserting.
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
    // Once a spec is selected, an icon carries the phase, so snapshot the full rendering.
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

    // Ambiguity is a stdout result, but not a successful read.
    expect(result.exitCode).to.eq(1)

    const outcome = result.json()

    expect(outcome).to.deep.include({ ambiguous: true, selector: '.item', count: 3 })

    // These selectors come from the live DOM rather than a stubbed binding.
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
    expect(failureOutput(result)).to.include('0 to 2, since ".item" matched 3 elements')
  })

  it('exits 1 for an --at beyond the default selector’s single match', async () => {
    const result = await instance.tap(['dom', '--at', '1'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('0 to 0, since "body" matched 1 element')
  })

  it('exits 1 for an invalid selector', async () => {
    const result = await instance.tap(['dom', '--selector', '#status['])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('Expected --selector to be a valid CSS selector')
  })

  it('projects the accessibility tree of the body', async () => {
    const result = await instance.tap(['--json', 'aria'])

    expect(result.exitCode).to.eq(0)

    const outcome = result.json()
    const roles = outcome.nodes.map((node: { role: string }) => node.role)

    // The body itself projects to nothing — it is a structural role — so the
    // fixture's own content sits at the top of the tree.
    expect(outcome.nodes[0]).to.include({ depth: 0, role: 'heading', name: 'Tap fixture' })
    expect(roles, 'the document root is above the body').to.not.include('RootWebArea')
    expect(outcome.nodeCount).to.eq(outcome.nodes.length)
    expect(roles).to.include.members(['heading', 'region', 'button', 'textbox', 'checkbox'])

    expect(roles).to.not.include.members(['StaticText', 'generic', 'InlineTextBox'])

    // `collectTrueStates` includes Chrome's boolean states, not tristates such as checked.
    const named = (role: string, name: string) => outcome.nodes.find((node: { role: string, name?: string }) => node.role === role && node.name === name)

    expect(named('button', 'Locked')?.states).to.deep.eq(['disabled'])
    expect(named('textbox', 'Required field')?.states).to.deep.eq(['required'])
  })

  it('roots the accessibility tree at a selector', async () => {
    const result = await instance.tap(['--json', 'aria', '--selector', '#panel'])

    expect(result.exitCode).to.eq(0)

    const outcome = result.json()
    const roles = outcome.nodes.map((node: { role: string }) => node.role)

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

  it('exits 1 with SPEC_IN_PROGRESS while a spec is still running', async () => {
    await instance.requestRun(SLOW_SPEC)

    // `running` is the only stage the reads reject as in-progress; `loading` is still
    // short of a run of its own and reports SPEC_NOT_STARTED.
    await instance.waitForStatus((status) => status.status === 'running', 'the running stage')

    const result = await instance.tap(['dom'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('is currently running')
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
    const settled = await instance.runSpec(SLOW_SPEC)

    expect(settled.status).to.eq('passed')
    expect(settled.startedAt).to.be.a('string')
    expect(settled.startedAt).to.not.eq(firstStartedAt)
  })

  it('keeps the app under test readable after a failing run', async () => {
    const settled = await instance.runSpec(FAILING_SPEC)

    expect(settled.status).to.eq('failed')

    const result = await instance.tap(['--json', 'dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.include({ found: true, html: STATUS_DIV })
  })

  it('renders the failure in the command log', async () => {
    // Reuse the prior failed run because only it renders the error panel.
    const overview = (await instance.tap(['--json', 'reporter'])).json()
    const [test] = overview.suites.flatMap((suite: { tests: Array<{ id: string }> }) => suite.tests)

    const result = await instance.tap(['reporter', '--test-id', test.id])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('reporter failed command log', result.stdout)
  })

  it('exits 1 with NO_INSTANCE once the instance is gone', async () => {
    // SIGKILL skips the record cleanup an orderly exit would run, so the record outlives
    // its writer. Discovery reaps it on the next read (`reapIfDead` in
    // cypress-instances/store.ts), so an unclean exit reports NO_INSTANCE rather than
    // STALE_INSTANCE — the latter needs a pid that is alive but no longer answering.
    await instance.terminate()

    const result = await instance.tap(['dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include(copyFor('NO_INSTANCE'))
  })
})

/**
 * Proves a `cypress.open()` instance is discoverable and readable through tap. The full
 * read surface is already covered above against the CLI-spawned instance.
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
    expect(result.json().nodes[0]).to.include({ depth: 0, role: 'heading', name: 'Tap fixture' })
  })

  it('still exits 1 for an ambiguous selector', async () => {
    const result = await instance.tap(['--json', 'dom', '--selector', '.item'])

    expect(result.exitCode).to.eq(1)
    expect(result.json()).to.deep.include({ ambiguous: true, count: 3 })
  })
})

/**
 * Enforces the user-facing help policy in `cli/lib/tap/AGENTS.md`. Commands are parsed
 * from top-level help so newly added commands are covered automatically.
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
 * Pinning restores a command's DOM snapshot into the AUT frame. The fixture changes
 * #status so reads can distinguish the pinned snapshot from the live page.
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

  it('renders the spec overview for humans', async () => {
    const result = await instance.tap(['reporter'])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('reporter spec overview', result.stdout)
  })

  it('renders a test’s command log for humans', async () => {
    const result = await instance.tap(['reporter', '--test-id', testId])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('reporter command log', result.stdout)
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
    const live = (await instance.tap(['--json', 'dom', '--selector', '#status'])).json()

    expect(live.html).to.eq('<div id="status">clicked</div>')

    const pin = await instance.tap(['--json', 'pin', '--test-id', testId, '--command-id', clickCommandId, '--at', 'before'])

    expect(pin.exitCode).to.eq(0)
    expect(pin.json().pinned).to.deep.include({ test: testId })
    expect(pin.json().pinned.at).to.deep.include({ name: 'before', index: 1, total: 2 })

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
