import { TapManager } from '../tap-manager'
import { tapSnapshotSource, tapSnapshotStyles } from './snapshot-state'

const CYPRESS_VERSION = '15.0.0'

// A snapshot body is a real detached <body> element; body.get() returns it
// array-wrapped, the same one-element shape the driver's snapshot exposes.
const makeBody = (innerHTML: string) => {
  const body = document.createElement('body')

  body.innerHTML = innerHTML

  return { get: () => [body] }
}

describe('tap/commands/snapshot', () => {
  const COMMANDS = [
    { id: 'log-1', name: 'get', message: '#status', state: 'passed', type: 'parent', displayName: 'get', hookId: 'h1' },
  ]

  const TESTS_STATE = {
    r2: { id: 'r2', title: 'signs in', state: 'passed', commands: COMMANDS },
    r3: { id: 'r3', title: 'not run yet' },
  }

  const SNAPSHOT_PROPS = {
    id: 'log-1',
    url: 'http://localhost:8080/index.html',
    highlightAttr: 'data-cypress-el',
    viewportWidth: 1000,
    viewportHeight: 660,
    snapshots: [
      { name: 'before', body: makeBody('<h1>Sign in</h1>') },
      { name: 'after', body: makeBody('<h1>Sign in</h1><p id="status" data-cypress-el="true">Signed in as ada</p>') },
    ],
  }

  // window.Cypress in the spec is the instance running this test, so stub the
  // exported seams rather than the driver.
  const stubRunner = (runner: unknown) => cy.stub(tapSnapshotSource, 'getRunner').returns(runner)
  const stubStyles = (styles: unknown) => cy.stub(tapSnapshotStyles, 'getStyles').returns(styles)

  const fullRunner = () => {
    return {
      getTestsState: cy.stub().returns(TESTS_STATE),
      getSnapshotPropsForLog: cy.stub().returns(SNAPSHOT_PROPS),
    }
  }

  it('fails with NO_RUN when no spec has mounted a runner yet', async () => {
    stubRunner(undefined)

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-1' })

    expect(outcome).to.deep.eq({
      error: { code: 'NO_RUN', message: 'no spec has been run yet — use the run command to run a spec first' },
    })
  })

  it('fails with TEST_NOT_FOUND for an unknown test id', async () => {
    stubRunner(fullRunner())

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'nope', command: 'log-1' })

    expect(outcome).to.deep.eq({
      error: { code: 'TEST_NOT_FOUND', message: 'no test of this run matches the id "nope" — use the tests command to list this run’s tests' },
    })
  })

  it('fails with COMMAND_NOT_FOUND for an unknown command id', async () => {
    stubRunner(fullRunner())

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-9' })

    expect(outcome).to.deep.eq({
      error: { code: 'COMMAND_NOT_FOUND', message: 'no command of this test matches the id "log-9" — use the commands command to list this test’s commands' },
    })
  })

  it('fails with SNAPSHOT_UNAVAILABLE when the command captured no snapshot', async () => {
    stubRunner({
      getTestsState: () => TESTS_STATE,
      getSnapshotPropsForLog: () => ({ id: 'log-1', snapshots: null }),
    })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-1' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('SNAPSHOT_UNAVAILABLE')
  })

  it('returns the last snapshot by default: page HTML, the acted-on subject, and the snapshot listing', async () => {
    const runner = fullRunner()

    stubRunner(runner)

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-1' })

    expect(runner.getSnapshotPropsForLog).to.have.been.calledOnceWith('r2', 'log-1')

    const result = (outcome as { result: any }).result

    expect(result.command).to.deep.eq({ id: 'log-1', name: 'get', message: '#status', state: 'passed', type: 'parent' })
    expect(result.url).to.eq('http://localhost:8080/index.html')
    expect(result.viewport).to.deep.eq({ width: 1000, height: 660 })
    expect(result.snapshots).to.deep.eq([{ index: 1, name: 'before' }, { index: 2, name: 'after' }])
    expect(result.at).to.deep.eq({ index: 2, name: 'after' })
    expect(result.subject).to.deep.eq({ count: 1, html: ['<p id="status" data-cypress-el="true">Signed in as ada</p>'] })
    expect(result.html).to.contain('Signed in as ada')
    expect(result.truncated).to.be.undefined
    expect(result.styles).to.be.undefined

    // Round-trips through the CDP JSON boundary unchanged.
    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('selects a snapshot by name via --at', async () => {
    stubRunner(fullRunner())

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-1' }, { at: 'before' })

    const result = (outcome as { result: any }).result

    expect(result.at).to.deep.eq({ index: 1, name: 'before' })
    expect(result.html).to.eq('<body><h1>Sign in</h1></body>')
    // The 'before' snapshot has no acted-on element marked.
    expect(result.subject).to.be.undefined
  })

  it('selects a snapshot by 1-based index via --at', async () => {
    stubRunner(fullRunner())

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-1' }, { at: '1' })

    expect((outcome as { result: any }).result.at).to.deep.eq({ index: 1, name: 'before' })
  })

  it('fails with SNAPSHOT_NOT_FOUND when --at matches no snapshot', async () => {
    stubRunner(fullRunner())

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-1' }, { at: 'during' })

    expect(outcome).to.deep.eq({
      error: { code: 'SNAPSHOT_NOT_FOUND', message: 'no snapshot of this command matches "during" — available snapshots: "before" (1), "after" (2)' },
    })
  })

  it('scopes to a CSS selector, returning matches instead of the page HTML', async () => {
    stubRunner(fullRunner())

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-1' }, { selector: '#status' })

    const result = (outcome as { result: any }).result

    expect(result.matches).to.deep.eq({ count: 1, html: ['<p id="status" data-cypress-el="true">Signed in as ada</p>'] })
    expect(result.html).to.be.undefined
    expect(result.subject).to.be.undefined
  })

  it('reports a zero-count match as a result, not an error', async () => {
    stubRunner(fullRunner())

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-1' }, { selector: '.missing' })

    expect((outcome as { result: any }).result.matches).to.deep.eq({ count: 0, html: [] })
  })

  it('fails with INVALID_SELECTOR for a malformed selector', async () => {
    stubRunner(fullRunner())

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-1' }, { selector: '>>bad' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_SELECTOR')
  })

  it('includes the page stylesheets when --styles is set', async () => {
    stubRunner(fullRunner())
    stubStyles({ headStyles: ['body { margin: 0 }'], bodyStyles: [{ href: 'https://cdn.example/app.css' }] })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-1' }, { styles: 'true' })

    expect((outcome as { result: any }).result.styles).to.deep.eq({
      head: ['body { margin: 0 }'],
      body: [{ href: 'https://cdn.example/app.css' }],
    })
  })

  it('truncates HTML past --max-chars and flags it', async () => {
    stubRunner(fullRunner())

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2', command: 'log-1' }, { at: 'before', 'max-chars': '10' })

    const result = (outcome as { result: any }).result

    expect(result.truncated).to.eq(true)
    expect(result.html.length).to.eq(10)
  })

  it('fails dispatch without reading the runner when a required param is missing', async () => {
    const getRunner = stubRunner(fullRunner())

    const outcome = await new TapManager(CYPRESS_VERSION).exec('snapshot', { test: 'r2' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_ARGUMENTS')
    expect(getRunner).not.to.have.been.called
  })
})
