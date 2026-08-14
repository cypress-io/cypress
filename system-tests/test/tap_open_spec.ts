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
const NETWORK_SPEC = 'cypress/e2e/network.cy.js'
const RETRIES_SPEC = 'cypress/e2e/retries.cy.js'
const CONSOLE_PROPS_SPEC = 'cypress/e2e/console-props.cy.js'
const CONSOLE_PROPS_SHAPES_SPEC = 'cypress/e2e/console-props-shapes.cy.js'
const HOOKS_SPEC = 'cypress/e2e/hooks.cy.js'
const AGENTS_SPEC = 'cypress/e2e/agents.cy.js'
const UNBUILDABLE_SPEC = 'cypress/e2e/unbuildable.cy.js'
const LONG_RUN_SPEC = 'cypress/e2e/long-run.cy.js'
const HOOK_FAILURE_SPEC = 'cypress/e2e/hook-failure.cy.js'
const JOURNEY_SPEC = 'cypress/e2e/journey.cy.js'
const EVICTION_SPEC = 'cypress/e2e/eviction.cy.js'

/** Every spec of the tap-retries project, sorted — what `specs` has to list. */
const ALL_SPECS = [
  AGENTS_SPEC,
  SPEC,
  CONSOLE_PROPS_SHAPES_SPEC,
  CONSOLE_PROPS_SPEC,
  FAILING_SPEC,
  HOOK_FAILURE_SPEC,
  HOOKS_SPEC,
  JOURNEY_SPEC,
  // Driven by the app's own binding tests rather than this suite.
  'cypress/e2e/lifecycle.cy.js',
  LONG_RUN_SPEC,
  NETWORK_SPEC,
  PIN_SPEC,
  RETRIES_SPEC,
  SLOW_SPEC,
  UNBUILDABLE_SPEC,
].sort()

const STATUS_DIV = '<div id="status" data-cy="status">ready</div>'

const SUITE_TIMEOUT_MS = 360000

/** Failures render as `CODE: message` on stderr, so the code is the stable assertion. */
const failureOutput = (result: { stdout: string, stderr: string }) => `${result.stdout}${result.stderr}`

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

interface ReporterTest {
  id: string
  title: string
  state: string
  /** Only a retried test carries attempts, oldest first. */
  attempts?: Array<{ attempt: number, state: string }>
}

/** One row of a test's command log, as the reporter view reports it. */
interface ReporterCommand {
  id: string
  name?: string
  message?: string
  state?: string
  /** The hook section the row ran in — what qualifies a duplicated row number. */
  hookId?: string
  /** Set only when the driver dropped this test's details (numTestsKeptInMemory). */
  cleanedUp?: true
  aliases?: string[]
  aliasType?: string
  network?: Record<string, any>
}

/** The spec overview groups tests under their suite, so flatten it to run order. */
const specTests = async (instance: TapInstance): Promise<ReporterTest[]> => {
  const overview = (await instance.tap(['--json', 'reporter'])).json()

  return [...overview.tests, ...overview.suites.flatMap((suite: { tests: ReporterTest[] }) => suite.tests)]
}

/** Every fixture here holds a single test, so the run's first test is the one under read. */
const firstTest = async (instance: TapInstance): Promise<ReporterTest> => {
  const [test] = await specTests(instance)

  expect(test, 'a test in the settled run').to.exist

  return test
}

/** Command ids come from the reporter view of one test — its command log. */
const commandLog = async (instance: TapInstance, testId: string, extra: string[] = []): Promise<ReporterCommand[]> => {
  const result = await instance.tap(['--json', 'reporter', '--test-id', testId, ...extra])

  expect(result.exitCode, 'the command log read').to.eq(0)

  return result.json().commands
}

const rowNamed = (commands: ReporterCommand[], name: string): ReporterCommand => {
  const row = commands.find((command) => command.name === name)

  expect(row, `the ${name} row`).to.exist

  return row!
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
    expect(failureOutput(result)).to.include('NO_INSTANCE')
  })

  it('names the pid that was asked for when --instance matches nothing', async () => {
    const result = await tapWithoutInstance(['--instance', '999999', 'inspect', '--selector', '#status'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('NO_INSTANCE')
    expect(failureOutput(result)).to.include('999999')
  })
})

/**
 * What the CLI rejects before it looks for an instance. A CLI-native command
 * parses its positionals and options first, so none of this needs one.
 */
describe('tap CLI argument handling', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  it('prints help and exits 0 when asked for no command', async () => {
    const result = await tapWithoutInstance([])

    expect(result.exitCode, 'no command is not a failure').to.eq(0)
    expect(result.stdout).to.include('Commands:')
    expect(result.stdout, 'the listing falls back to the schema the CLI ships').to.include('reporter')
  })

  it('exits 1 for an option no command declares', async () => {
    const result = await tapWithoutInstance(['dom', '--not-an-option'])

    expect(result.exitCode).to.eq(1)
  })

  it('exits 1 and names the option a command requires', async () => {
    const result = await tapWithoutInstance(['inspect'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('--selector')
  })

  it('exits 1 for a missing required argument', async () => {
    const result = await tapWithoutInstance(['run'])

    expect(result.exitCode).to.eq(1)
  })

  it('exits 1 and says so for more arguments than a command takes', async () => {
    const result = await tapWithoutInstance(['run', 'a.cy.js', 'b.cy.js'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('too many arguments')
  })

  it('renders a command’s help without needing an instance', async () => {
    const result = await tapWithoutInstance(['reporter', '--help'])

    expect(result.exitCode).to.eq(0)
    expect(result.stdout).to.include('--test-id')
    expect(result.stdout).to.include('--attempt')
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

  it('exits 1 with SPEC_NOT_FOUND when asked to run a spec that does not exist', async () => {
    const result = await instance.tap(['run', 'cypress/e2e/not-a-real-spec.cy.js'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('SPEC_NOT_FOUND')
  })

  it('exits 1 with NO_RUN for an AUT read', async () => {
    // Short of a verdict there is no run to read: the resolved frame would be the
    // runner shell, so the read is refused rather than returning a misleading page.
    const result = await instance.tap(['dom'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('NO_RUN')
  })

  it('reports the spec-not-selected phase for humans', async () => {
    const result = await instance.tap(['status'])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('status before a spec is selected', result.stdout, [
      [new RegExp(String((await instance.status()).pid), 'g'), '<pid>'],
      [/ {2,}/g, '  '],
    ])
  })

  // Declared last: it selects a spec, which every test above depends on not having happened.
  it('confirms for humans what a run launched', async () => {
    // `run` returns as soon as the spec is requested, so it reports what was launched.
    const result = await instance.tap(['run', SPEC])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('run launched', result.stdout)
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

  it('reads through the pid --instance names', async () => {
    // Discovery finds this suite's instance anyway, so the pid path needs asking for.
    const { pid } = await instance.status()

    expect(pid, 'the pid status reports').to.be.a('number')

    const result = await instance.tap(['--json', '--instance', String(pid), 'dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.include({ found: true, html: STATUS_DIV })
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
    expect(failureOutput(result)).to.include('pass --at 0-2')
  })

  it('exits 1 for an --at beyond the default selector’s single match', async () => {
    const result = await instance.tap(['dom', '--at', '1'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('INVALID_INDEX')
    expect(failureOutput(result)).to.include('pass --at 0-0')
  })

  it('exits 1 for an invalid selector', async () => {
    const result = await instance.tap(['dom', '--selector', '#status['])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('is not a valid CSS selector')
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

  it('renders an inspected element for humans', async () => {
    const result = await instance.tap(['inspect', '--selector', '#status'])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('inspect an element', result.stdout, [
      // The fixture pins the element's size; where it sits depends on default margins.
      [/x \d+ {3}y \d+/, 'x <x>   y <y>'],
    ])
  })

  it('renders an element that matched nothing for humans', async () => {
    const result = await instance.tap(['inspect', '--selector', '#missing'])

    expect(result.exitCode, 'no match is an answer, not a failure').to.eq(0)

    snapshotRendering('inspect no match', result.stdout)
  })

  it('renders every spec under a counted heading for humans', async () => {
    const result = await instance.tap(['specs'])

    expect(result.exitCode).to.eq(0)
    expect(result.stdout).to.include(`SPECS (${ALL_SPECS.length})`)

    // Rows are ordered by last-modified, which the scaffolded copy leaves to
    // whatever wrote it, so they are sorted before snapshotting — the listing and
    // its heading are the rendering, the sequence is the copy's.
    const [heading, ...rows] = result.stdout.trimEnd().split('\n')

    snapshotRendering('specs listing', [heading, ...rows.sort()].join('\n'), [
      // Each row trails git's relative last-modified time, which drifts with the
      // clock — "a few seconds ago" the moment after scaffolding, more later.
      [/ {2,}[\w ]+ ago$/gm, '  <modified>'],
    ])
  })

  it('lists the reachable instances for humans', async () => {
    const result = await instance.tap(['instances'])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('instances listing', result.stdout, [
      [new RegExp(String((await instance.status()).pid), 'g'), '<pid>'],
      [/ {2,}/g, '  '],
    ])
  })

  it('reports the accessibility subtree of a selector matching nothing as empty', async () => {
    const result = await instance.tap(['--json', 'aria', '--selector', '#missing'])

    expect(result.exitCode, 'no match is an answer, not a failure').to.eq(0)
    expect(result.json().nodes).to.deep.eq([])

    const rendered = await instance.tap(['aria', '--selector', '#missing'])

    expect(rendered.stdout).to.include('No accessibility nodes found.')
  })

  it('answers an ambiguous selector the same way for aria and inspect', async () => {
    // One answer, three commands: never a read of one arbitrary match.
    for (const command of ['aria', 'inspect']) {
      const result = await instance.tap(['--json', command, '--selector', '.item'])

      expect(result.exitCode, `${command} refused the ambiguous read`).to.eq(1)
      expect(result.json()).to.deep.include({ ambiguous: true, selector: '.item', count: 3 })
    }
  })

  it('indexes into an ambiguous selector with --at for aria and inspect', async () => {
    const aria = await instance.tap(['--json', 'aria', '--selector', '.item', '--at', '1'])

    expect(aria.exitCode).to.eq(0)
    expect(aria.json().nodes[0]).to.include({ depth: 0, role: 'listitem' })

    const inspected = await instance.tap(['--json', 'inspect', '--selector', '.item', '--at', '2'])

    expect(inspected.exitCode).to.eq(0)
    expect(inspected.json()).to.deep.include({ found: true, tag: 'li' })
  })

  it('numbers no further than the matches it can name, and says so', async () => {
    // Not snapshotted: `*` also matches whatever the proxy injected, so the total is
    // the browser's business. The cap and the note are the point.
    const result = await instance.tap(['aria', '--selector', '*'])

    expect(result.exitCode).to.eq(1)
    expect(result.stdout).to.match(/showing the first 10 of \d+ matches/)
    expect(result.stdout).to.include('--at takes any index up to')
  })

  it('exits 1 with INVALID_LIMIT for a cap that is not a positive integer', async () => {
    for (const args of [['dom', '--max-chars', '0'], ['dom', '--max-chars', 'lots'], ['aria', '--max-nodes', '0']]) {
      const result = await instance.tap(args)

      expect(result.exitCode, args.join(' ')).to.eq(1)
      expect(failureOutput(result), args.join(' ')).to.include('INVALID_LIMIT')
    }
  })

  it('exits 1 with INVALID_INDEX for an --at that is not a whole number', async () => {
    const result = await instance.tap(['dom', '--selector', '.item', '--at', '1.5'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('INVALID_INDEX')
  })

  it('reads within an explicit --timeout', async () => {
    // Only the accepting half: a deadline short enough to be sure to fire races the
    // work rather than bounding it, so the expiry is covered against a frozen instance.
    const result = await instance.tap(['--json', '--timeout', '30000', 'dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.include({ found: true, html: STATUS_DIV })
  })

  it('lists every spec of the project and nothing else', async () => {
    const specs = (await instance.tap(['--json', 'specs'])).json<Array<{ relativePath: string }>>()

    // The whole set, not a subset: a listing that quietly drops a spec is a spec
    // an agent can never run. Adding a fixture spec means adding it here.
    expect(specs.map((spec) => spec.relativePath).sort()).to.deep.eq(ALL_SPECS)
    // Ordering is by git's last-modified time, which the scaffolded copy has none
    // of, so the set is asserted rather than the sequence.
  })

  it('serves several reads issued at once', async () => {
    // An agent that fans out its reads gets one session per command, so this is
    // the only thing that exercises them overlapping.
    const results = await Promise.all([
      instance.tap(['--json', 'dom', '--selector', '#status']),
      instance.tap(['--json', 'aria', '--selector', '#panel']),
      instance.tap(['--json', 'inspect', '--selector', '#toggle']),
      instance.tap(['--json', 'status']),
    ])

    expect(results.map((result) => result.exitCode)).to.deep.eq([0, 0, 0, 0])
    expect(results[0].json()).to.deep.include({ found: true, html: STATUS_DIV })
    expect(results[1].json().nodes[0]).to.include({ role: 'region', name: 'Controls' })
    expect(results[2].json()).to.deep.include({ found: true, tag: 'button' })
    expect(results[3].json()).to.include({ status: 'passed' })
  })

  it('does not expose the commands the instance keeps to itself', async () => {
    // `run-state` and `resolve-selector` back the status and ambiguity answers;
    // they are advertised as hidden, so the CLI never registers them.
    for (const hidden of ['run-state', 'resolve-selector']) {
      const result = await instance.tap([hidden])

      expect(result.exitCode, hidden).to.not.eq(0)
    }
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
    const test = await firstTest(instance)

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
    expect(failureOutput(result)).to.include('NO_INSTANCE')
  })
})

/**
 * What answers while a spec is still running. The reads share a single test
 * because they all have to land inside one run's window.
 */
describe('tap CLI while a spec is running', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance

  before(async () => {
    instance = await openTapInstance('tap-retries')
    await instance.requestRun(LONG_RUN_SPEC)
    await instance.waitForStatus((status) => status.status === 'running', 'the running stage')
  })

  after(async () => {
    await instance?.kill()
  })

  it('reports progress but refuses the reads a settled run owns', async () => {
    const status = await instance.status()

    expect(status.status).to.eq('running')
    expect(status.spec).to.eq(LONG_RUN_SPEC)
    expect(status.startedAt, 'the run under way').to.be.a('string')

    // The reporter reads the live attempt, so a run can be watched, not just its outcome.
    const overview = (await instance.tap(['--json', 'reporter'])).json()
    const tests = [...overview.tests, ...overview.suites.flatMap((suite: { tests: ReporterTest[] }) => suite.tests)]

    expect(tests, 'the running test is already listed').to.have.length(1)

    const view = (await instance.tap(['--json', 'reporter', '--test-id', tests[0].id])).json()
    const pending = (view.commands as ReporterCommand[]).find((command) => command.state === 'pending')

    expect(pending, 'the command still running').to.exist

    // The page is mid-flight, so these are refused rather than read off a moving target.
    for (const args of [['dom'], ['aria'], ['inspect', '--selector', '#status']]) {
      const refused = await instance.tap(args)

      expect(refused.exitCode, args.join(' ')).to.eq(1)
      expect(failureOutput(refused), args.join(' ')).to.include('RUN_IN_PROGRESS')
    }

    // pin has its own guard: pinning would swap the frame under the run.
    const pinned = await instance.tap(['pin', '--test-id', tests[0].id, '--command-id', '1'])

    expect(pinned.exitCode).to.eq(1)
    expect(failureOutput(pinned)).to.include('RUN_IN_PROGRESS')

    const cleared = await instance.tap(['--json', 'pin', '--clear'])

    expect(cleared.exitCode).to.eq(0)
    expect(cleared.json()).to.deep.eq({ cleared: false })
  })

  it('renders the running phase for humans', async () => {
    const result = await instance.tap(['status'])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('status while running', result.stdout, [
      [new RegExp(String((await instance.status()).pid), 'g'), '<pid>'],
      [/ {2,}/g, '  '],
    ])
  })
})

/**
 * Discovery with more than one candidate: which instance a command targets, and
 * how to say which. Two projects, so the cwd tiebreak has something to go on.
 */
describe('tap CLI with more than one instance running', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let retries: TapInstance
  let eviction: TapInstance
  let retriesPid: number
  let evictionPid: number

  before(async () => {
    retries = await openTapInstance('tap-retries')
    // `additional` keeps the shared dir, so the first instance stays discoverable.
    eviction = await openTapInstance('tap-eviction', { additional: true })

    retriesPid = (await retries.status()).pid!
    evictionPid = (await eviction.status()).pid!
  })

  after(async () => {
    await eviction?.kill()
    await retries?.kill()
  })

  it('lists both instances, each with its own project', async () => {
    const listed = (await retries.tap(['--json', 'instances'])).json<Array<{ pid: number, projectRoot: string }>>()

    expect(listed).to.have.length(2)
    expect(listed.map((entry) => entry.pid)).to.have.members([retriesPid, evictionPid])
    expect(listed.find((entry) => entry.pid === evictionPid)!.projectRoot).to.include('tap-eviction')
  })

  it('targets the instance whose project the command was run from', async () => {
    expect((await retries.status()).pid).to.eq(retriesPid)
    expect((await eviction.status()).pid).to.eq(evictionPid)
  })

  it('targets the other one when --instance names it', async () => {
    const crossed = await retries.tap(['--json', '--instance', String(evictionPid), 'status'])

    expect(crossed.exitCode).to.eq(0)
    expect(crossed.json().pid, 'the pid asked for, not the one nearby').to.eq(evictionPid)
    expect(crossed.json().projectRoot).to.include('tap-eviction')
  })

  it('says how many matched, and how to pick, when help is asked of a crowd', async () => {
    const result = await retries.tap(['--help'])

    expect(result.exitCode).to.eq(0)
    expect(result.stdout).to.include('2 running instances matched')
    expect(result.stdout).to.include('Pass --instance <pid> to target another')
  })
})

/**
 * A pid alive but no longer answering: the only state that reports
 * STALE_INSTANCE rather than NO_INSTANCE.
 */
describe('tap CLI against an instance that stopped answering', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance

  before(async () => {
    instance = await openTapInstance('tap-retries')
    await instance.runSpec(SPEC)
    await instance.suspend()
  })

  after(async () => {
    // SIGKILL reaps a stopped tree, so this needs no resume first.
    await instance?.kill()
  })

  it('exits 1 with STALE_INSTANCE, saying Cypress was running and is not now', async () => {
    const result = await instance.tap(['dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('STALE_INSTANCE')
    expect(failureOutput(result)).to.include('no longer responding')
  })

  it('reports "not connected" from status rather than failing', async () => {
    // status answers whatever it finds, and this is one of the things it can find.
    const result = await instance.tap(['--json', 'status'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.eq({ status: 'not connected' })
  })

  it('reads again once the instance answers', async () => {
    await instance.resume()

    // A resumed tree answers again, but not instantly.
    await instance.waitForStatus((status) => status.status === 'passed', 'the instance to answer again')

    const result = await instance.tap(['--json', 'dom', '--selector', '#status'])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.include({ found: true, html: STATUS_DIV })
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

    testId = (await firstTest(instance)).id
    clickCommandId = rowNamed(await commandLog(instance, testId), 'click').id
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

  it('renders one command, top to bottom, for humans', async () => {
    const result = await instance.tap(['command', '--test-id', testId, '--command-id', clickCommandId])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('command detail of a click', result.stdout, [
      // The click lands in the middle of the button, so where that is depends on how the
      // browser lays the fixture out — a pixel either way across platforms and font metrics.
      [/^( +)x +\d+$/m, '$1x  <x>'],
      [/^( +)y +\d+$/m, '$1y  <y>'],
    ])
  })

  it('exits 1 with PIN_TARGET_REQUIRED when given nothing to pin or clear', async () => {
    const result = await instance.tap(['pin'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('PIN_TARGET_REQUIRED')
  })

  it('exits 1 with SNAPSHOT_NOT_FOUND and names the snapshots there are', async () => {
    const result = await instance.tap(['pin', '--test-id', testId, '--command-id', clickCommandId, '--at', 'midway'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('SNAPSHOT_NOT_FOUND')
    expect(failureOutput(result), 'the names it would have taken').to.include('"before" (1)')
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

  it('addresses a snapshot by position, and switches without releasing', async () => {
    const first = await instance.tap(['--json', 'pin', '--test-id', testId, '--command-id', clickCommandId, '--at', '1'])

    expect(first.exitCode).to.eq(0)
    expect(first.json().pinned.at).to.deep.include({ name: 'before', index: 1, total: 2 })

    // Re-running on the pinned command moves which snapshot shows.
    const second = await instance.tap(['--json', 'pin', '--test-id', testId, '--command-id', clickCommandId, '--at', '2'])

    expect(second.exitCode).to.eq(0)
    expect(second.json().pinned.at).to.deep.include({ name: 'after', index: 2, total: 2 })

    const after = (await instance.tap(['--json', 'dom', '--selector', '#status'])).json()

    expect(after.html, 'the post-click snapshot').to.eq('<div id="status">clicked</div>')
  })

  it('answers aria and inspect out of the pinned frame too', async () => {
    // The pin swaps the frame all three reads resolve against, not just dom's.
    const pinned = await instance.tap(['pin', '--test-id', testId, '--command-id', clickCommandId, '--at', 'before'])

    expect(pinned.exitCode).to.eq(0)

    const aria = (await instance.tap(['--json', 'aria', '--selector', '#toggle'])).json()

    expect(aria.nodes[0]).to.include({ depth: 0, role: 'button', name: 'toggle' })

    const inspected = (await instance.tap(['--json', 'inspect', '--selector', '#status'])).json()

    expect(inspected).to.deep.include({ found: true, tag: 'div' })
  })

  it('renders the pin the same way from pin and from status', async () => {
    const pinned = await instance.tap(['pin', '--test-id', testId, '--command-id', clickCommandId, '--at', 'before'])

    expect(pinned.exitCode).to.eq(0)

    snapshotRendering('pin a snapshot', pinned.stdout)

    // One thing, one rendering: status reports the pin with the same block.
    const status = await instance.tap(['status'])

    expect(status.stdout).to.include(pinned.stdout.trim())

    snapshotRendering('status while pinned', status.stdout, [
      [new RegExp(String((await instance.status()).pid), 'g'), '<pid>'],
      [/ {2,}/g, '  '],
    ])
  })

  it('restores the live app on --clear', async () => {
    const cleared = await instance.tap(['pin', '--clear'])

    expect(cleared.exitCode).to.eq(0)

    const live = (await instance.tap(['--json', 'dom', '--selector', '#status'])).json()

    expect(live.html, 'the live post-click page').to.eq('<div id="status">clicked</div>')

    const status = await instance.status()

    expect(status.pinned, 'no pin is reported once cleared').to.be.undefined
  })

  it('reports a --clear with no pin to release as having cleared nothing', async () => {
    const result = await instance.tap(['--json', 'pin', '--clear'])

    expect(result.exitCode, 'nothing to release is not a failure').to.eq(0)
    expect(result.json()).to.deep.eq({ cleared: false })

    const rendered = await instance.tap(['pin', '--clear'])

    snapshotRendering('pin clear with nothing pinned', rendered.stdout)
  })
})

/**
 * The walk an agent takes when a run fails, in one test because the chaining is
 * the behavior: every step is addressed by an id the step before it printed.
 */
describe('tap CLI debugging a failed run end to end', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance

  before(async () => {
    instance = await openTapInstance('tap-retries')
  })

  after(async () => {
    await instance?.kill()
  })

  it('walks from instance discovery to the DOM that explains a failed run', async () => {
    const journeyOutput: string[] = []

    const instancesResult = await instance.tap(['--json', 'instances'])
    const instances = instancesResult.json<Array<{
      pid: number
      projectRoot: string
      testingType: string
      browserAttached: boolean
      rendererResponsive?: boolean
    }>>()

    expect(instancesResult.exitCode).to.eq(0)
    expect(instances).to.have.length(1)
    expect(instances[0]).to.deep.include({
      projectRoot: instance.projectRoot,
      testingType: 'e2e',
      browserAttached: true,
      rendererResponsive: true,
    })

    const renderedInstances = await instance.tap(['instances'])

    journeyOutput.push(`$ cypress tap instances\n${renderedInstances.stdout.trimEnd()}`)

    const pid = String(instances[0].pid)
    const specsResult = await instance.tap(['--json', '--instance', pid, 'specs'])
    const specs = specsResult.json<Array<{ relativePath: string }>>()
    const failingSpec = specs.find((spec) => spec.relativePath === FAILING_SPEC)

    expect(specsResult.exitCode).to.eq(0)
    expect(failingSpec, 'the failing spec listed for the discovered instance').to.exist

    const renderedSpecs = await instance.tap(['--instance', pid, 'specs'])
    const [specsHeading, ...specRows] = renderedSpecs.stdout.trimEnd().split('\n')

    journeyOutput.push(`$ cypress tap --instance ${pid} specs\n${[specsHeading, ...specRows.sort()].join('\n')}`)

    const before = await instance.status()
    const runResult = await instance.tap(['--instance', pid, 'run', failingSpec!.relativePath])

    expect(runResult.exitCode).to.eq(0)

    journeyOutput.push(`$ cypress tap --instance ${pid} run ${failingSpec!.relativePath}\n${runResult.stdout.trimEnd()}`)

    await instance.waitForStatus(
      (current) => current.status === 'failed' && current.startedAt !== before.startedAt,
      `a failed verdict for ${failingSpec!.relativePath}`,
    )

    const statusResult = await instance.tap(['--json', '--instance', pid, 'status'])
    const status = statusResult.json()

    expect(statusResult.exitCode).to.eq(0)
    expect(status.status).to.eq('failed')
    expect(status.results).to.deep.include({ passed: 0, failed: 1 })
    expect(status.spec).to.eq(FAILING_SPEC)

    const renderedStatus = await instance.tap(['--instance', pid, 'status'])

    journeyOutput.push(`$ cypress tap --instance ${pid} status\n${renderedStatus.stdout.trimEnd()}`)

    const overviewResult = await instance.tap(['--json', '--instance', pid, 'reporter'])
    const overview = overviewResult.json()
    const tests: ReporterTest[] = [
      ...overview.tests,
      ...overview.suites.flatMap((suite: { tests: ReporterTest[] }) => suite.tests),
    ]
    const [test] = tests

    expect(overviewResult.exitCode).to.eq(0)
    expect(test, 'the failed test listed in the reporter').to.exist
    expect(test.state).to.eq('failed')

    const renderedOverview = await instance.tap(['--instance', pid, 'reporter'])

    journeyOutput.push(`$ cypress tap --instance ${pid} reporter\n${renderedOverview.stdout.trimEnd()}`)

    const view = (await instance.tap(['--json', '--instance', pid, 'reporter', '--test-id', test.id])).json()

    expect(view.error.name).to.eq('AssertionError')
    expect(view.error.codeFrame.file).to.include('failing.cy.js')

    const failed = (view.commands as ReporterCommand[]).find((command) => command.state === 'failed')

    expect(failed, 'the failed row').to.exist
    expect(failed!.name).to.eq('assert')

    const renderedReporter = await instance.tap(['--instance', pid, 'reporter', '--test-id', test.id])

    journeyOutput.push(`$ cypress tap --instance ${pid} reporter --test-id ${test.id}\n${renderedReporter.stdout.trimEnd()}`)

    const detail = (await instance.tap(['--json', '--instance', pid, 'command', '--test-id', test.id, '--command-id', failed!.id])).json()

    expect(detail.state).to.eq('failed')
    expect(detail.consoleProps.name).to.eq('assert')
    expect(detail.snapshots, 'a snapshot to pin the failure at').to.have.length.greaterThan(0)

    const renderedCommand = await instance.tap(['--instance', pid, 'command', '--test-id', test.id, '--command-id', failed!.id])

    journeyOutput.push(`$ cypress tap --instance ${pid} command --test-id ${test.id} --command-id ${failed!.id}\n${renderedCommand.stdout.trimEnd()}`)

    // Pin the failed row, and the frame answers as of the failure rather than now.
    const pinned = await instance.tap(['--json', '--instance', pid, 'pin', '--test-id', test.id, '--command-id', failed!.id])

    expect(pinned.exitCode).to.eq(0)
    expect(pinned.json().pinned).to.deep.include({ test: test.id })
    expect(pinned.json().pinned.command.id).to.eq(failed!.id)

    expect((await instance.status()).pinned).to.deep.include({ test: test.id })

    // The snapshot marks the element the assertion was about, so a pinned read is
    // distinguishable from the live page by more than its text.
    const dom = (await instance.tap(['--json', 'dom', '--selector', '#status'])).json()

    expect(dom).to.deep.include({ found: true, html: '<div id="status" data-cy="status" data-cypress-el="true">ready</div>' })

    const inspected = (await instance.tap(['--json', 'inspect', '--selector', '#status'])).json()

    expect(inspected).to.deep.include({ found: true, tag: 'div' })
    expect(inspected.attributes).to.deep.eq({ 'id': 'status', 'data-cy': 'status', 'data-cypress-el': 'true' })

    const renderedDom = await instance.tap(['--instance', pid, 'dom', '--selector', '#status'])
    const renderedInspect = await instance.tap(['--instance', pid, 'inspect', '--selector', '#status'])

    journeyOutput.push(
      `$ cypress tap --instance ${pid} dom --selector #status\n${renderedDom.stdout.trimEnd()}`,
      `$ cypress tap --instance ${pid} inspect --selector #status\n${renderedInspect.stdout.trimEnd()}`,
    )

    snapshotRendering('complete failed run debugging journey', journeyOutput.join('\n\n'), [
      [/ {2,}[\w ]+ ago$/gm, '  <modified>'],
      [new RegExp(pid, 'g'), '<pid>'],
      [/x \d+ {3}y \d+/, 'x <x>   y <y>'],
      [/ {2,}/g, '  '],
    ])

    // Released, the same read answers with the live element, highlight and all gone.
    expect((await instance.tap(['pin', '--clear'])).exitCode).to.eq(0)
    expect((await instance.status()).pinned, 'no pin survives the release').to.be.undefined

    const live = (await instance.tap(['--json', 'dom', '--selector', '#status'])).json()

    expect(live).to.deep.include({ found: true, html: STATUS_DIV })
  })

  it('renders the failed row the way a reader would meet it', async () => {
    const settled = await instance.runSpec(FAILING_SPEC)

    expect(settled.status).to.eq('failed')

    const test = await firstTest(instance)
    const failed = rowNamed(await commandLog(instance, test.id), 'assert')

    const result = await instance.tap(['command', '--test-id', test.id, '--command-id', failed.id])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('command detail of a failed assertion', result.stdout)
  })

  it('reruns the spec and reaches the same verdict, under a new startedAt', async () => {
    const before = await instance.status()
    const settled = await instance.runSpec(FAILING_SPEC)

    expect(settled.status).to.eq('failed')
    expect(settled.startedAt).to.not.eq(before.startedAt)
  })
})

/**
 * The three network shapes the reporter distinguishes: a stubbed `cy.intercept`,
 * a request that reached origin, and a `cy.request`.
 */
describe('tap CLI against a run with network activity', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance
  let testId: string
  let commands: ReporterCommand[]

  before(async () => {
    instance = await openTapInstance('tap-retries')
    await instance.runSpec(NETWORK_SPEC)

    testId = (await firstTest(instance)).id
    commands = await commandLog(instance, testId)
  })

  after(async () => {
    await instance?.kill()
  })

  /** Every network row logs under the same name; the network object tells them apart. */
  const requests = () => commands.filter((command) => command.name === 'request')

  const stubbedRow = (): ReporterCommand => {
    const row = requests().find((command) => command.network?.stubbed === true)

    expect(row, 'the stubbed request row').to.exist

    return row!
  }

  it('reports the intercept as a route rather than a command', async () => {
    const view = (await instance.tap(['--json', 'reporter', '--test-id', testId])).json()

    expect(view.routes).to.have.length(1)
    expect(view.routes[0]).to.deep.include({ method: 'GET', stubbed: true, alias: 'getUsers' })
    expect(view.routes[0].url).to.include('/api/users')
    expect(view.routes[0].numResponses).to.be.greaterThan(0)

    // Registrations are bucketed under routes, so none of them is a log row.
    expect(view.commands.map((command: ReporterCommand) => command.name)).to.not.include('route')
  })

  it('details the stubbed request’s network fields', async () => {
    const result = await instance.tap(['--json', 'command', '--test-id', testId, '--command-id', stubbedRow().id])

    expect(result.exitCode).to.eq(0)

    const { network } = result.json()

    expect(network).to.deep.include({ method: 'GET', stubbed: true, alias: 'getUsers', indicator: 'successful' })
    expect(network.url).to.include('/api/users')
  })

  it('reports a request that reached origin as unstubbed and unaliased', async () => {
    const real = requests().find((command) => command.network?.stubbed === false)

    expect(real, 'a request that went to origin').to.exist
    expect(real!.network!.indicator).to.eq('successful')
    expect(real!.network!.alias, 'it matched no intercept').to.be.undefined
  })

  it('summarizes cy.request in the message it logs no url for', async () => {
    const cyRequest = requests().find((command) => command.network && !command.network.url && !command.network.method)

    expect(cyRequest, 'the cy.request row').to.exist
    expect(cyRequest!.network!.indicator).to.eq('successful')
    expect(cyRequest!.message, 'method and status, since the row carries neither').to.match(/^GET \d+ /)
  })

  it('renders a network row’s own detail panel for humans', async () => {
    const result = await instance.tap(['command', '--test-id', testId, '--command-id', stubbedRow().id])

    expect(result.exitCode).to.eq(0)

    // Not snapshotted: the row's console properties carry the browser's own request
    // headers, so how much of the payload folds tracks the Chrome build.
    expect(result.stdout).to.include('NETWORK')
    expect(result.stdout).to.match(/METHOD\s+GET/)
    expect(result.stdout).to.match(/STUBBED\s+yes/)
    expect(result.stdout).to.match(/ALIAS\s+@getUsers/)
    expect(result.stdout).to.include('/api/users')
  })

  it('addresses an event row by its own e-prefixed id', async () => {
    // An xhr or fetch row annotates a command rather than being one, so it takes an
    // attempt-wide `e1`..`eN` instead of a row number.
    const events = commands.filter((command) => /^e\d+$/.test(command.id))

    expect(events, 'event rows in the log').to.have.length.greaterThan(0)

    const result = await instance.tap(['--json', 'command', '--test-id', testId, '--command-id', events[0].id])

    expect(result.exitCode).to.eq(0)
    expect(result.json()).to.deep.include({ id: events[0].id, name: events[0].name })
  })

  it('gives every row of the log an id to address it by', async () => {
    // A row named in the rendering but not readable back is the one thing a log an
    // agent walks cannot do.
    expect(commands).to.have.length.greaterThan(0)
    expect(commands.filter((command) => !command.id), 'rows with no id').to.deep.eq([])
  })

  it('renders the reporter view for humans, routes table and all', async () => {
    const result = await instance.tap(['reporter', '--test-id', testId])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('reporter network command log', result.stdout)
  })
})

/**
 * The one result whose shape the CLI does not control: the driver bounds the
 * values before they ship, the rendering folds what arrives, `--json` undoes both.
 */
describe('tap CLI reading a command’s console properties', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance

  // One instance across both fixtures: each inner block runs the spec it reads.
  before(async () => {
    instance = await openTapInstance('tap-retries')
  })

  after(async () => {
    await instance?.kill()
  })

  describe('a payload the driver bounded before it shipped', () => {
    let testId: string
    let deepId: string
    let emptyId: string

    // The values the fixture logs, so the assertions describe the payload.
    const body = Array.from({ length: 500 }, (_unused, index) => ({ id: index, tags: ['a', 'b'] }))
    const note = 'x'.repeat(1200)
    const withheldFor = (length: number) => `[${length.toLocaleString('en-US')} characters withheld — pass --json to include it]`

    before(async () => {
      await instance.runSpec(CONSOLE_PROPS_SPEC)

      testId = (await firstTest(instance)).id

      const commands = await commandLog(instance, testId)

      deepId = rowNamed(commands, 'deep-console-props').id
      emptyId = rowNamed(commands, 'empty-console-props').id
    })

    it('names a value too long to read by its length, keeping the rest legible', async () => {
      const result = await instance.tap(['command', '--test-id', testId, '--command-id', deepId])

      expect(result.exitCode).to.eq(0)
      expect(result.stdout, 'the long string').to.include(withheldFor(note.length))
      expect(result.stdout, 'the large container').to.include(withheldFor(JSON.stringify(body).length))

      snapshotRendering('command with a bounded payload', result.stdout)
    })

    it('returns every console property in full with --json', async () => {
      const result = await instance.tap(['--json', 'command', '--test-id', testId, '--command-id', deepId])

      expect(result.exitCode).to.eq(0)

      const { actual } = result.json().consoleProps.props

      expect(actual.body, 'nothing is withheld from a payload no one is reading').to.deep.eq(body)
      expect(actual.note).to.eq(note)
      // The structure around a bounded value survives whole either way.
      expect(actual.status).to.eq(200)
      expect(actual.headers).to.deep.eq({ 'content-type': 'application/json' })
    })

    it('leaves a bounded value bounded at --depth all', async () => {
      const result = await instance.tap(['command', '--test-id', testId, '--command-id', deepId, '--depth', 'all'])

      expect(result.exitCode).to.eq(0)
      // Depth opens the rendering; this was bounded before the CLI saw it.
      expect(result.stdout).to.include(withheldFor(note.length))
    })

    it('falls back to the default depth for an unusable --depth', async () => {
      const result = await instance.tap(['command', '--test-id', testId, '--command-id', deepId, '--depth', 'wide'])

      expect(result.exitCode, 'an unreadable dial is not a failed read').to.eq(0)
      expect(result.stdout).to.include('--depth takes a whole number or "all"')
    })

    it('keeps both panels for a command that logged neither', async () => {
      const result = await instance.tap(['command', '--test-id', testId, '--command-id', emptyId])

      expect(result.exitCode).to.eq(0)

      snapshotRendering('command with no snapshots or console props', result.stdout)
    })
  })

  describe('the shapes the rendering has to make legible', () => {
    let testId: string
    let shapesId: string
    let envelopeId: string

    before(async () => {
      await instance.runSpec(CONSOLE_PROPS_SHAPES_SPEC)

      testId = (await firstTest(instance)).id

      const commands = await commandLog(instance, testId)

      shapesId = rowNamed(commands, 'props-shapes').id
      envelopeId = rowNamed(commands, 'props-envelope').id
    })

    const shapes = (extra: string[] = []) => instance.tap(['command', '--test-id', testId, '--command-id', shapesId, ...extra])

    it('summarizes what is too deep or too wide to take in at a glance', async () => {
      const result = await shapes()

      expect(result.exitCode).to.eq(0)
      // The wide container folds however shallow it sits; the nesting folds at depth.
      expect(result.stdout).to.include('{12 keys}')
      expect(result.stdout).to.include('2 sections collapsed — open all of it with --depth all')

      snapshotRendering('command console props shapes', result.stdout)
    })

    it('opens all of it at --depth all', async () => {
      const result = await shapes(['--depth', 'all'])

      expect(result.exitCode).to.eq(0)
      expect(result.stdout, 'the wide container is expanded').to.not.include('{12 keys}')
      expect(result.stdout, 'the deepest level is reached').to.include('the deepest value')
      expect(result.stdout, 'nothing is left to open').to.not.include('collapsed')

      snapshotRendering('command console props shapes at depth all', result.stdout)
    })

    it('folds every container at --depth 0', async () => {
      const result = await shapes(['--depth', '0'])

      expect(result.exitCode).to.eq(0)
      expect(result.stdout).to.include('5 sections collapsed')

      snapshotRendering('command console props shapes at depth 0', result.stdout)
    })

    it('never lets payload bytes disturb the row they land on', async () => {
      const result = await shapes()

      // Tabs and carriage returns read as spaces; an escape sequence is dropped, since
      // it would tint a row the renderer never chose to.
      expect(result.stdout).to.include('tab here carriage then red')
      expect(result.stdout, 'the payload’s escape sequence').to.not.include('[31m')
    })

    it('exits 1 with SNAPSHOT_UNAVAILABLE for a row that captured none', async () => {
      // These rows are `Cypress.log` calls, so they captured no DOM snapshot.
      const result = await instance.tap(['pin', '--test-id', testId, '--command-id', shapesId])

      expect(result.exitCode).to.eq(1)
      expect(failureOutput(result)).to.include('SNAPSHOT_UNAVAILABLE')
    })

    it('renders the envelope sections that sit beside props', async () => {
      const result = await instance.tap(['command', '--test-id', testId, '--command-id', envelopeId])

      expect(result.exitCode).to.eq(0)
      expect(result.stdout).to.include('MOUSE EVENTS (2)')
      expect(result.stdout).to.include('COORDS')
      expect(result.stdout).to.include('GROUPS')
      expect(result.stdout).to.include('ARGS')
      expect(result.stdout).to.include('ERROR')

      snapshotRendering('command console props envelope', result.stdout)
    })
  })
})

/**
 * Row numbers restart in every hook section, which is what makes a bare number
 * ambiguous and `<hookId>:<number>` necessary.
 */
describe('tap CLI against a spec with hooks and a pending test', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance
  let tests: ReporterTest[]

  before(async () => {
    instance = await openTapInstance('tap-retries')
    await instance.runSpec(HOOKS_SPEC)

    tests = await specTests(instance)
  })

  after(async () => {
    await instance?.kill()
  })

  const titled = (title: string): ReporterTest => {
    const test = tests.find((entry) => entry.title === title)

    expect(test, `the "${title}" test`).to.exist

    return test!
  }

  it('reports every test of the spec, pending ones included', async () => {
    expect(tests.map((test) => test.state)).to.deep.eq(['passed', 'passed', 'pending', 'passed'])
  })

  it('renders the overview with its suite breadcrumbs and state badges', async () => {
    const result = await instance.tap(['reporter'])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('reporter spec overview with hooks', result.stdout)
  })

  it('names the hook section every row of the log ran in', async () => {
    const view = (await instance.tap(['--json', 'reporter', '--test-id', titled('logs a command of its own').id])).json()

    // The synthesized test body plus the hooks that ran around it, in order.
    expect(view.hooks.map((hook: { hookName: string }) => hook.hookName)).to.deep.eq(['before each', 'test body', 'after each'])
  })

  it('renders the log split into its hook sections', async () => {
    const result = await instance.tap(['reporter', '--test-id', titled('logs nothing of its own').id])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('reporter command log with hooks', result.stdout)
  })

  it('exits 1 with AMBIGUOUS_COMMAND for a row number two sections share', async () => {
    const testId = titled('logs nothing of its own').id

    // This test body logs nothing, so nothing wins the tie and the CLI will not guess.
    const result = await instance.tap(['command', '--test-id', testId, '--command-id', '1'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('AMBIGUOUS_COMMAND')
    expect(failureOutput(result), 'the qualified id to retry with').to.match(/qualify the id with its section, e.g. "h\d+:1"/)
  })

  it('resolves the same number once qualified with its section', async () => {
    const testId = titled('logs nothing of its own').id
    const log = await commandLog(instance, testId)
    const hookIds = [...new Set(log.map((row) => row.hookId))].filter(Boolean) as string[]

    expect(hookIds, 'rows from more than one section').to.have.length.greaterThan(1)

    for (const hookId of hookIds) {
      const result = await instance.tap(['--json', 'command', '--test-id', testId, '--command-id', `${hookId}:1`])

      expect(result.exitCode, `${hookId}:1`).to.eq(0)
      expect(result.json().hook).to.deep.include({ hookId })
    }
  })

  it('gives the test body a bare number, over the hooks that share it', async () => {
    const testId = titled('logs a command of its own').id
    const result = await instance.tap(['--json', 'command', '--test-id', testId, '--command-id', '1'])

    expect(result.exitCode).to.eq(0)
    expect(result.json().hook).to.deep.include({ hookId: testId, hookName: 'test body' })
    expect(result.json().message).to.eq('test body')
  })

  it('renders a pending test as a log with nothing in it', async () => {
    const result = await instance.tap(['reporter', '--test-id', titled('never runs').id])

    expect(result.exitCode, 'a test that never ran is still a test').to.eq(0)

    snapshotRendering('reporter pending test', result.stdout)
  })
})

/** The reporter panels that aggregate an attempt rather than list its rows. */
describe('tap CLI against a spec with spies, stubs and a session', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance
  let tests: ReporterTest[]

  before(async () => {
    instance = await openTapInstance('tap-retries')
    await instance.runSpec(AGENTS_SPEC)

    tests = await specTests(instance)
  })

  after(async () => {
    await instance?.kill()
  })

  it('tabulates the spy and the stub with their call counts', async () => {
    const view = (await instance.tap(['--json', 'reporter', '--test-id', tests[0].id])).json()

    expect(view.agents.map((agent: { functionName: string }) => agent.functionName)).to.deep.eq(['greet', 'shout'])
    // The driver numbers each agent, and the event rows are labeled with that type.
    expect(view.agents[0].type).to.match(/^spy-\d+$/)
    expect(view.agents[1].type).to.match(/^stub-\d+$/)
    expect(view.agents[0]).to.deep.include({ functionName: 'greet', callCount: 2 })
    expect(view.agents[1]).to.deep.include({ functionName: 'shout', callCount: 1 })
    expect(view.agents[0].aliases).to.deep.eq(['greeter'])
    expect(view.agents[1].aliases).to.deep.eq(['shouter'])
  })

  it('renders the spies and stubs panel for humans', async () => {
    const result = await instance.tap(['reporter', '--test-id', tests[0].id])

    expect(result.exitCode).to.eq(0)
    expect(result.stdout).to.include('SPIES / STUBS (2)')

    snapshotRendering('reporter with spies and stubs', result.stdout)
  })

  it('lists the session the test created', async () => {
    const view = (await instance.tap(['--json', 'reporter', '--test-id', tests[1].id])).json()

    expect(view.sessions).to.have.length(1)
    expect(view.sessions[0]).to.deep.include({ name: 'tap session' })

    const result = await instance.tap(['reporter', '--test-id', tests[1].id])

    expect(result.stdout).to.include('SESSIONS (1)')
    expect(result.stdout).to.include('tap session')
  })
})

/**
 * A spec that never builds is the one verdict carrying a reason instead of
 * counts — terminal, so a poller has to stop on it rather than wait through it.
 */
describe('tap CLI against a spec that cannot be built', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance

  before(async () => {
    instance = await openTapInstance('tap-retries')
    await instance.runSpec(UNBUILDABLE_SPEC)
  })

  after(async () => {
    await instance?.kill()
  })

  it('reports a failed verdict carrying the build failure, and no counts', async () => {
    const status = await instance.status()

    expect(status.status).to.eq('failed')
    expect(status.spec).to.eq(UNBUILDABLE_SPEC)
    expect(status.error, 'the reason the spec could not run').to.include('this-module-does-not-exist')
    expect(status.results, 'a spec that never ran has no counts').to.be.undefined
    expect(status.totalTests).to.be.undefined
  })

  it('renders the build failure under the phase for humans', async () => {
    const result = await instance.tap(['status'])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('status with a build failure', result.stdout, [
      [new RegExp(String((await instance.status()).pid), 'g'), '<pid>'],
      // The compiler's own stack names paths and loaders, so keep only the first line.
      [/(Error: Webpack Compilation Error)[\s\S]*/, '$1 <compiler detail>'],
      [/ {2,}/g, '  '],
    ])
  })

  it('reports an empty run: no tests to list, and none to address', async () => {
    // The bundle delivered no test, so mocha finished with nothing — an all-zero sweep
    // that only `status`'s error tells apart from a wholly passing run.
    const overview = (await instance.tap(['--json', 'reporter'])).json()

    expect(overview.spec).to.eq(UNBUILDABLE_SPEC)
    expect(overview.stats).to.deep.eq({ passed: 0, failed: 0, pending: 0, skipped: 0 })
    expect(overview.tests).to.deep.eq([])
    expect(overview.suites).to.deep.eq([])

    const missing = await instance.tap(['reporter', '--test-id', 'r3'])

    expect(missing.exitCode).to.eq(1)
    expect(failureOutput(missing)).to.include('TEST_NOT_FOUND')
  })

  it('renders the empty run for humans', async () => {
    const result = await instance.tap(['reporter'])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('reporter empty spec overview', result.stdout)
  })

  it('still answers the frame reads, with no app under test in them', async () => {
    // The app puts its own page in the frame, so these succeed and report an empty
    // document. The reason is only in `status`.
    const aria = await instance.tap(['--json', 'aria'])

    expect(aria.exitCode).to.eq(0)
    expect(aria.json()).to.deep.eq({ nodes: [{ depth: 0, role: 'RootWebArea' }], nodeCount: 1 })

    const dom = await instance.tap(['--json', 'dom'])

    expect(dom.exitCode).to.eq(0)
    expect(dom.json().html, 'nothing of the spec ever rendered').to.not.include('Unbuildable')
  })
})

/**
 * A before-all that throws takes its whole suite with it. Skipped is the one
 * outcome the counts strip shows only when it is non-zero.
 */
describe('tap CLI against a suite a hook took down', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance
  let tests: ReporterTest[]

  before(async () => {
    instance = await openTapInstance('tap-retries')
    await instance.runSpec(HOOK_FAILURE_SPEC)

    tests = await specTests(instance)
  })

  after(async () => {
    await instance?.kill()
  })

  it('reports one failure and the rest skipped, never run', async () => {
    const status = await instance.status()

    expect(status.status).to.eq('failed')
    expect(status.results).to.deep.include({ passed: 0, failed: 1 })
    expect((status.results as { skipped: number }).skipped, 'the tests the hook took with it').to.be.greaterThan(0)

    expect(tests[0].state).to.eq('failed')
    expect(tests.slice(1).map((test) => test.state)).to.satisfy((states: string[]) => states.every((state) => state === 'skipped' || state === 'pending'))
  })

  it('renders the overview with a skipped count for humans', async () => {
    const result = await instance.tap(['reporter'])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('reporter spec overview with skips', result.stdout)
  })

  it('attributes the failure to the hook that raised it', async () => {
    const view = (await instance.tap(['--json', 'reporter', '--test-id', tests[0].id])).json()

    expect(view.error.message).to.include('the before hook could not set up')
    expect(view.error.message).to.include('before all')
    expect(view.error.codeFrame.file).to.include('hook-failure.cy.js')

    expect(view.hooks.map((hook: { hookName: string }) => hook.hookName)).to.include('before all')

    // The hook threw before logging anything, so there is no row to attribute it to.
    expect(view.commands, 'nothing ran to be logged').to.deep.eq([])
  })

  it('renders the hook failure for humans', async () => {
    const result = await instance.tap(['reporter', '--test-id', tests[0].id])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('reporter hook failure', result.stdout)
  })
})

/**
 * The driver keeps only the most recent tests' details (numTestsKeptInMemory), so
 * an older test's rows survive with their content dropped. `cleanedUp` is what
 * tells that apart from a row that logged nothing.
 */
describe('tap CLI against a test the driver evicted from memory', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance
  let tests: ReporterTest[]

  before(async () => {
    instance = await openTapInstance('tap-eviction')
    await instance.runSpec(EVICTION_SPEC)

    tests = await specTests(instance)
  })

  after(async () => {
    await instance?.kill()
  })

  it('runs every test, whatever it keeps of them', async () => {
    expect(tests.map((test) => test.state)).to.deep.eq(['passed', 'passed', 'passed'])
  })

  it('marks the evicted rows, and leaves the latest test whole', async () => {
    const evicted = await commandLog(instance, tests[0].id)
    const kept = await commandLog(instance, tests[2].id)

    expect(evicted, 'the rows themselves survive the eviction').to.have.length.greaterThan(0)
    expect(evicted.every((row) => row.cleanedUp === true), 'every row of the oldest test').to.eq(true)
    expect(evicted.every((row) => row.message === undefined), 'their content is what was dropped').to.eq(true)

    expect(kept.some((row) => row.cleanedUp), 'the latest test is untouched').to.eq(false)
    expect(rowNamed(kept, 'visit').message).to.include('eviction.html')
  })

  it('says so on an evicted row rather than reporting it as empty', async () => {
    const evicted = await commandLog(instance, tests[0].id)
    const detail = (await instance.tap(['--json', 'command', '--test-id', tests[0].id, '--command-id', evicted[0].id])).json()

    expect(detail.cleanedUp).to.eq(true)
    expect(detail.snapshots, 'nothing left to pin').to.deep.eq([])
    // Not absent: an evicted log answers with a bare stand-in, so the panel says the
    // details are gone rather than reading as a command that logged nothing.
    expect(Object.keys(detail.consoleProps)).to.deep.eq(['Message'])
    expect(String(detail.consoleProps.Message)).to.match(/memory/i)

    const kept = await commandLog(instance, tests[2].id)
    const whole = (await instance.tap(['--json', 'command', '--test-id', tests[2].id, '--command-id', rowNamed(kept, 'click').id])).json()

    expect(whole.snapshots).to.have.length.greaterThan(0)
    expect(whole.consoleProps).to.exist
  })

  it('exits 1 with SNAPSHOT_UNAVAILABLE when asked to pin an evicted row', async () => {
    const evicted = await commandLog(instance, tests[0].id)
    const result = await instance.tap(['pin', '--test-id', tests[0].id, '--command-id', evicted[0].id])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('SNAPSHOT_UNAVAILABLE')
    expect(failureOutput(result), 'the reason names the setting that decided it').to.include('numTestsKeptInMemory')
  })

  it('renders an evicted log for humans, marked as cleaned up', async () => {
    const result = await instance.tap(['reporter', '--test-id', tests[0].id])

    expect(result.exitCode).to.eq(0)
    expect(result.stdout).to.include('(cleaned up)')

    snapshotRendering('reporter evicted command log', result.stdout)
  })

  it('renders an evicted row’s detail, empty panels and all', async () => {
    const evicted = await commandLog(instance, tests[0].id)
    const result = await instance.tap(['command', '--test-id', tests[0].id, '--command-id', evicted[0].id])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('command detail of an evicted row', result.stdout)
  })
})

/**
 * One spec carrying every kind of row at once, walked the way a reader walks it.
 * The tests above cover each row alone; this covers them composing into one log.
 */
describe('tap CLI walking a spec with every kind of row', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance
  let testId: string
  let commands: ReporterCommand[]

  before(async () => {
    instance = await openTapInstance('tap-retries')
    await instance.runSpec(JOURNEY_SPEC)

    testId = (await firstTest(instance)).id
    commands = await commandLog(instance, testId)
  })

  after(async () => {
    await instance?.kill()
  })

  it('renders the whole log for humans: hook, route, event, log and alias rows', async () => {
    const result = await instance.tap(['reporter', '--test-id', testId])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('reporter journey command log', result.stdout)
  })

  it('carries the dom alias on the row that defined it', async () => {
    const aliased = commands.find((command) => command.aliases?.includes('nameField'))

    expect(aliased, 'the row .as() named').to.exist
    expect(aliased!.aliasType, 'a dom alias, tinted apart from a route’s').to.eq('dom')
  })

  it('details the cy.log row, whose one snapshot the driver left unnamed', async () => {
    const logged = rowNamed(commands, 'log')

    expect(logged.message).to.eq('the stub answered')

    const detail = (await instance.tap(['--json', 'command', '--test-id', testId, '--command-id', logged.id])).json()

    expect(detail.hook).to.deep.include({ hookId: testId, hookName: 'test body' })
    // A row with a single snapshot carries no name for it, so only the index addresses it.
    expect(detail.snapshots).to.have.length(1)
    expect(detail.snapshots[0]).to.include({ index: 1 })
    expect(detail.snapshots[0].name, 'one unnamed snapshot').to.be.undefined

    const pinned = await instance.tap(['--json', 'pin', '--test-id', testId, '--command-id', logged.id])

    expect(pinned.exitCode, 'addressable by index alone').to.eq(0)
    expect(pinned.json().pinned.at).to.deep.eq({ index: 1, total: 1 })

    await instance.tap(['pin', '--clear'])
  })

  it('details the typed field’s row, with the event table the driver logged', async () => {
    const typed = rowNamed(commands, 'type')

    const detail = (await instance.tap(['--json', 'command', '--test-id', testId, '--command-id', typed.id])).json()

    // Not asserted value by value: these are the browser's own key events.
    expect(detail.consoleProps.table, 'the keyboard events').to.exist
    expect(detail.snapshots).to.have.length.greaterThan(0)

    const rendered = await instance.tap(['command', '--test-id', testId, '--command-id', typed.id])

    expect(rendered.exitCode).to.eq(0)
    expect(rendered.stdout).to.match(/EVENTS \(\d+\)/)
  })

  it('walks the click either side of its snapshots, then puts the page back', async () => {
    const click = rowNamed(commands, 'click')

    const before = await instance.tap(['--json', 'pin', '--test-id', testId, '--command-id', click.id, '--at', 'before'])

    expect(before.exitCode).to.eq(0)
    expect((await instance.tap(['--json', 'dom', '--selector', '#status'])).json().html).to.include('ready')

    const after = await instance.tap(['--json', 'pin', '--test-id', testId, '--command-id', click.id, '--at', 'after'])

    expect(after.exitCode).to.eq(0)
    expect((await instance.tap(['--json', 'dom', '--selector', '#status'])).json().html).to.include('clicked')

    expect((await instance.tap(['pin', '--clear'])).exitCode).to.eq(0)
    expect((await instance.tap(['--json', 'dom', '--selector', '#status'])).json().html).to.eq('<div id="status">clicked</div>')
  })

  it('reports the route the hook registered, kept out of the log', async () => {
    const view = (await instance.tap(['--json', 'reporter', '--test-id', testId])).json()

    expect(view.routes).to.have.length(1)
    expect(view.routes[0]).to.deep.include({ method: 'GET', stubbed: true, alias: 'getUsers' })
    expect(view.hooks.map((hook: { hookName: string }) => hook.hookName)).to.include('before each')
  })
})

/**
 * A retried test is the one case where a test has more than one story to tell,
 * and `--attempt` is how either of them is read.
 */
describe('tap CLI against a retried test', function () {
  this.timeout(SUITE_TIMEOUT_MS)

  let instance: TapInstance
  let testId: string

  before(async () => {
    instance = await openTapInstance('tap-retries')
    await instance.runSpec(RETRIES_SPEC)

    testId = (await firstTest(instance)).id
  })

  after(async () => {
    await instance?.kill()
  })

  it('reports the failed first attempt beside the passing verdict', async () => {
    const test = await firstTest(instance)

    expect(test.state, 'the fixture passes on its retry').to.eq('passed')
    expect(test.attempts?.map((attempt) => attempt.state)).to.deep.eq(['failed', 'passed'])
  })

  it('renders the retried test in the spec overview for humans', async () => {
    const result = await instance.tap(['reporter'])

    expect(result.exitCode).to.eq(0)

    snapshotRendering('reporter spec overview with retries', result.stdout)
  })

  it('renders an earlier attempt’s failure for humans', async () => {
    const latest = await instance.tap(['reporter', '--test-id', testId])
    const first = await instance.tap(['reporter', '--test-id', testId, '--attempt', '1'])

    expect(latest.exitCode).to.eq(0)
    expect(first.exitCode).to.eq(0)
    expect(latest.stdout, 'the passing attempt has no error panel').to.not.include('AssertionError')

    snapshotRendering('reporter failed first attempt', first.stdout)
  })

  it('reads a command out of an earlier attempt', async () => {
    const failed = (await commandLog(instance, testId, ['--attempt', '1'])).find((command) => command.state === 'failed')

    expect(failed, 'a failed row in the first attempt').to.exist

    const result = await instance.tap(['--json', 'command', '--test-id', testId, '--command-id', failed!.id, '--attempt', '1'])

    expect(result.exitCode).to.eq(0)

    const detail = result.json()

    expect(detail).to.include({ id: failed!.id, state: 'failed' })
    // The console properties are read from the same attempt as the row.
    expect(detail.consoleProps).to.include({ name: failed!.name, type: 'command' })
  })

  it('exits 1 with ATTEMPT_NOT_FOUND past the last attempt', async () => {
    const result = await instance.tap(['reporter', '--test-id', testId, '--attempt', '3'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('ATTEMPT_NOT_FOUND')
  })

  it('exits 1 when --attempt is given without the test it selects within', async () => {
    const result = await instance.tap(['reporter', '--attempt', '1'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('ATTEMPT_NOT_FOUND')
  })

  it('exits 1 with TEST_NOT_FOUND for an unknown test id', async () => {
    const result = await instance.tap(['reporter', '--test-id', 'not-a-test'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('TEST_NOT_FOUND')
  })

  it('exits 1 with COMMAND_NOT_FOUND for an unknown command id', async () => {
    const result = await instance.tap(['command', '--test-id', testId, '--command-id', '9999'])

    expect(result.exitCode).to.eq(1)
    expect(failureOutput(result)).to.include('COMMAND_NOT_FOUND')
  })
})
