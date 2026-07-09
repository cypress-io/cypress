import { TapManager } from '../tap-manager'
import { resetPinState } from './pin'
import { tapPinSource } from './snapshot-pin'

const CYPRESS_VERSION = '15.0.0'

describe('tap/commands/pin', () => {
  const TESTS_STATE = {
    r2: {
      id: 'r2',
      title: 'signs in',
      state: 'passed',
      commands: [
        { id: 'log-1', name: 'get', message: '#status', state: 'passed', type: 'parent' },
      ],
    },
  }

  // The snapshot entries are opaque to the command — it only reads `name` and
  // hands the object to restoreDom — so plain objects stand in for the bodies.
  const SNAPSHOTS = [{ name: 'before' }, { name: 'after' }]
  const SNAPSHOT_PROPS = { url: 'http://localhost:8080/index.html', snapshots: SNAPSHOTS }

  const stubSource = (over: { runner?: unknown, running?: boolean } = {}) => {
    const runner = 'runner' in over ? over.runner : {
      getTestsState: () => TESTS_STATE,
      getSnapshotPropsForLog: () => SNAPSHOT_PROPS,
    }
    const getRunner = cy.stub(tapPinSource, 'getRunner').returns(runner)
    const detachDom = cy.stub().returns('ORIGINAL-DOM')
    const restoreDom = cy.stub()

    cy.stub(tapPinSource, 'getAutIframe').returns({ detachDom, restoreDom })
    cy.stub(tapPinSource, 'isRunning').returns(over.running ?? false)

    const setPinned = cy.stub(tapPinSource, 'setPinned')

    return { getRunner, detachDom, restoreDom, setPinned }
  }

  beforeEach(() => {
    resetPinState()
  })

  it('pins the last snapshot by default: captures the original, restores the snapshot, flags pinned', async () => {
    const { detachDom, restoreDom, setPinned } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: 'log-1' })

    expect(detachDom).to.have.been.calledOnce
    // Default --at is the last snapshot (the command's final state).
    expect(restoreDom).to.have.been.calledOnceWith(SNAPSHOTS[1])
    expect(setPinned).to.have.been.calledOnceWith(true)

    expect(outcome).to.deep.eq({
      result: {
        pinned: { test: 'r2', command: 'log-1', at: { index: 2, name: 'after' } },
        url: 'http://localhost:8080/index.html',
      },
    })

    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('pins a named snapshot via --at', async () => {
    const { restoreDom } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: 'log-1' }, { at: 'before' })

    expect(restoreDom).to.have.been.calledOnceWith(SNAPSHOTS[0])
    expect((outcome as { result: any }).result.pinned.at).to.deep.eq({ index: 1, name: 'before' })
  })

  it('fails with SNAPSHOT_NOT_FOUND when --at matches nothing, without touching the iframe', async () => {
    const { restoreDom } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: 'log-1' }, { at: 'during' })

    expect(outcome).to.deep.eq({
      error: { code: 'SNAPSHOT_NOT_FOUND', message: 'no snapshot of this command matches "during" — available snapshots: "before" (1), "after" (2)' },
    })

    expect(restoreDom).not.to.have.been.called
  })

  it('refuses to pin over an existing pin with ALREADY_PINNED', async () => {
    stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: 'log-1' })
    const outcome = await manager.exec('pin', { test: 'r2', command: 'log-1' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('ALREADY_PINNED')
  })

  it('clears a pin: restores the original DOM and unflags, then a fresh pin works', async () => {
    const { restoreDom, setPinned } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: 'log-1' })
    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    expect(restoreDom).to.have.been.calledWith('ORIGINAL-DOM')
    expect(setPinned).to.have.been.calledWith(false)
    expect(cleared).to.deep.eq({ result: { cleared: true } })

    // Pin state is released, so a new pin succeeds rather than ALREADY_PINNED.
    const outcome = await manager.exec('pin', { test: 'r2', command: 'log-1' })

    expect((outcome as { result: any }).result.pinned.command).to.eq('log-1')
  })

  it('treats --clear with nothing pinned as an idempotent no-op', async () => {
    const { restoreDom } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { clear: 'true' })

    expect(outcome).to.deep.eq({ result: { cleared: false } })
    expect(restoreDom).not.to.have.been.called
  })

  it('auto-releases a stale pin when its command no longer resolves (spec switch / re-run), without restoring stale DOM', async () => {
    const getSnapshotPropsForLog = cy.stub().returns(SNAPSHOT_PROPS)

    cy.stub(tapPinSource, 'getRunner').returns({ getTestsState: () => TESTS_STATE, getSnapshotPropsForLog })

    const restoreDom = cy.stub()

    cy.stub(tapPinSource, 'getAutIframe').returns({ detachDom: cy.stub().returns('ORIGINAL-DOM'), restoreDom })
    cy.stub(tapPinSource, 'isRunning').returns(false)
    cy.stub(tapPinSource, 'setPinned')

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: 'log-1' })
    expect(restoreDom).to.have.been.calledOnce // the snapshot render

    // Simulate a re-run: the command id is reused, but its snapshots are fresh
    // objects — so identity no longer matches the object we pinned.
    getSnapshotPropsForLog.returns({ url: SNAPSHOT_PROPS.url, snapshots: [{ name: 'before' }, { name: 'after' }] })

    // Reconciliation drops the stale pin, so clear is a no-op that does NOT
    // restore the now-stale original DOM.
    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    expect(cleared).to.deep.eq({ result: { cleared: false } })
    expect(restoreDom).to.have.been.calledOnce // still only the pin render — no stale restore
  })

  it('requires a test and command (or --clear), without reading the runner', async () => {
    const { getRunner } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('PIN_TARGET_REQUIRED')
    expect(getRunner).not.to.have.been.called
  })

  it('fails with NO_RUN when no runner has mounted', async () => {
    stubSource({ runner: undefined })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: 'log-1' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('NO_RUN')
  })

  it('refuses to pin while a spec is running', async () => {
    stubSource({ running: true })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: 'log-1' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('RUN_IN_PROGRESS')
  })

  it('fails with TEST_NOT_FOUND and COMMAND_NOT_FOUND for unknown ids', async () => {
    stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    expect((await manager.exec('pin', { test: 'nope', command: 'log-1' }) as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')
    expect((await manager.exec('pin', { test: 'r2', command: 'log-9' }) as { error: { code: string } }).error.code).to.eq('COMMAND_NOT_FOUND')
  })

  it('fails with SNAPSHOT_UNAVAILABLE when the command has no snapshot', async () => {
    stubSource({ runner: {
      getTestsState: () => TESTS_STATE,
      getSnapshotPropsForLog: () => ({ snapshots: null }),
    } })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: 'log-1' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('SNAPSHOT_UNAVAILABLE')
  })
})
