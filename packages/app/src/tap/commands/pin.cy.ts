import { TapManager } from '../tap-manager'
import { resetPinState } from './pin'
import { tapManagerDataSource } from '../tap-manager-data-source'

const CYPRESS_VERSION = '15.0.0'

describe('tap/commands/pin', () => {
  const TESTS_STATE = {
    r2: {
      id: 'r2',
      title: 'signs in',
      state: 'passed',
      commands: [
        { id: 'log-1', name: 'get', message: '#status', state: 'passed', type: 'parent' },
        { id: 'log-2', name: 'click', message: '', state: 'passed', type: 'child' },
      ],
    },
  }

  // The snapshot entries are opaque to the command — it only reads `name` and
  // hands the object to the app pin — so plain objects stand in for the bodies.
  const SNAPSHOTS = [{ name: 'before' }, { name: 'after' }]
  const SNAPSHOT_PROPS = { url: 'http://localhost:8080/index.html', snapshots: SNAPSHOTS }

  const stubSource = (over: { runner?: unknown, running?: boolean } = {}) => {
    const runner = 'runner' in over ? over.runner : {
      getTestState: (id: string) => TESTS_STATE[id as keyof typeof TESTS_STATE],
      getSnapshotPropsForLog: () => SNAPSHOT_PROPS,
    }
    const getRunner = cy.stub(tapManagerDataSource, 'getSnapshotRunner').returns(runner)
    const detachDom = cy.stub().returns('ORIGINAL-DOM')
    const restoreDom = cy.stub()

    cy.stub(tapManagerDataSource, 'getAutIframe').returns({ detachDom, restoreDom })

    const isRunning = cy.stub(tapManagerDataSource, 'isRunning').returns(over.running ?? false)

    const pinSnapshot = cy.stub(tapManagerDataSource, 'pinSnapshot')
    const changeSnapshotState = cy.stub(tapManagerDataSource, 'changeSnapshotState')
    const unpinSnapshot = cy.stub(tapManagerDataSource, 'unpinSnapshot')
    const stopListening = cy.stub()
    const onUnpinned = cy.stub(tapManagerDataSource, 'onSnapshotUnpinned').returns(stopListening)

    return { getRunner, detachDom, restoreDom, pinSnapshot, changeSnapshotState, unpinSnapshot, onUnpinned, stopListening, isRunning }
  }

  beforeEach(() => {
    resetPinState()
  })

  it('pins the last snapshot by default: captures the original, drives the app pin, listens for unpin', async () => {
    const { detachDom, pinSnapshot, onUnpinned, restoreDom } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: '1' })

    expect(detachDom).to.have.been.calledOnce
    // Default --at is the last snapshot (the command's final state), index 1.
    // The tap id '1' resolved to the driver log id, which is what the app pin
    // and reporter key on.
    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 1, 'r2', 'log-1')
    expect(onUnpinned).to.have.been.calledOnce
    // The render goes through the app pin, so we never restore directly here.
    expect(restoreDom).not.to.have.been.called

    expect(outcome).to.deep.eq({
      result: {
        pinned: {
          test: 'r2',
          at: { index: 2, total: 2, name: 'after' },
          command: { id: '1', name: 'get', message: '#status', state: 'passed', type: 'parent' },
        },
        url: 'http://localhost:8080/index.html',
      },
    })

    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('pins a named snapshot via --at', async () => {
    const { pinSnapshot } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: '1' }, { at: 'before' })

    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 0, 'r2', 'log-1')
    expect((outcome as { result: any }).result.pinned.at).to.deep.eq({ index: 1, total: 2, name: 'before' })
  })

  it('fails with SNAPSHOT_NOT_FOUND when --at matches nothing, without touching the iframe', async () => {
    const { detachDom, pinSnapshot } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: '1' }, { at: 'during' })

    expect(outcome).to.deep.eq({
      error: { code: 'SNAPSHOT_NOT_FOUND', message: 'no snapshot of this command matches "during" — available snapshots: "before" (1), "after" (2)' },
    })

    expect(detachDom).not.to.have.been.called
    expect(pinSnapshot).not.to.have.been.called
  })

  it('switches to a different command in place, reusing the first pin’s captured DOM and unpin listener', async () => {
    const { detachDom, pinSnapshot, onUnpinned, restoreDom, unpinSnapshot } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })
    const switched = await manager.exec('pin', { test: 'r2', command: '2' })

    expect((switched as { result: any }).result.pinned.command.id).to.eq('2')
    // No re-capture and no second listener: the original DOM and unpin listener
    // from the first pin stand, so clearing still restores the true live app.
    expect(detachDom).to.have.been.calledOnce
    expect(pinSnapshot).to.have.been.calledTwice
    expect(onUnpinned).to.have.been.calledOnce

    await manager.exec('pin', {}, { clear: 'true' })
    expect(restoreDom).to.have.been.calledOnceWith('ORIGINAL-DOM')
    expect(unpinSnapshot).to.have.been.calledOnce
  })

  it('leaves the existing pin intact when a switch to another command fails validation', async () => {
    const { detachDom, restoreDom, unpinSnapshot } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })
    const failed = await manager.exec('pin', { test: 'r2', command: '2' }, { at: 'during' })

    expect((failed as { error: { code: string } }).error.code).to.eq('SNAPSHOT_NOT_FOUND')
    // The failed switch touched nothing — the '1' pin is still live, proven by a
    // clear that restores its captured DOM rather than a no-op.
    expect(detachDom).to.have.been.calledOnce
    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    expect(cleared).to.deep.eq({ result: { cleared: true } })
    expect(restoreDom).to.have.been.calledOnceWith('ORIGINAL-DOM')
    expect(unpinSnapshot).to.have.been.calledOnce
  })

  it('re-pinning the same command with a new --at moves the pin in place, without re-detaching', async () => {
    const { detachDom, pinSnapshot, changeSnapshotState, onUnpinned } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    // First pin lands on the last snapshot (index 1, "after").
    await manager.exec('pin', { test: 'r2', command: '1' })
    const moved = await manager.exec('pin', { test: 'r2', command: '1' }, { at: 'before' })

    // The move re-selects the snapshot in place: no second capture, no re-pin,
    // no new unpin listener — only a state switch to "before" (index 0).
    expect(detachDom).to.have.been.calledOnce
    expect(pinSnapshot).to.have.been.calledOnce
    expect(onUnpinned).to.have.been.calledOnce
    expect(changeSnapshotState).to.have.been.calledOnceWith(0)

    expect((moved as { result: any }).result.pinned).to.deep.eq({
      test: 'r2',
      at: { index: 1, total: 2, name: 'before' },
      command: { id: '1', name: 'get', message: '#status', state: 'passed', type: 'parent' },
    })
  })

  it('rejects a bad --at on a move and leaves the existing pin untouched', async () => {
    const { changeSnapshotState } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })
    const outcome = await manager.exec('pin', { test: 'r2', command: '1' }, { at: 'during' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('SNAPSHOT_NOT_FOUND')
    // The pin never moved, so no state switch happened.
    expect(changeSnapshotState).not.to.have.been.called
  })

  it('clears a pin: restores the original DOM, unpins, and stops listening, then a fresh pin works', async () => {
    const { restoreDom, unpinSnapshot, stopListening } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })
    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    expect(restoreDom).to.have.been.calledOnceWith('ORIGINAL-DOM')
    expect(unpinSnapshot).to.have.been.calledOnce
    expect(stopListening).to.have.been.calledOnce
    expect(cleared).to.deep.eq({ result: { cleared: true } })

    // Pin state is released, so a fresh pin lands cleanly.
    const outcome = await manager.exec('pin', { test: 'r2', command: '1' })

    expect((outcome as { result: any }).result.pinned.command.id).to.eq('1')
  })

  it('restores the captured DOM and drops the pin when the runner unpins externally (the ✕)', async () => {
    const { restoreDom, unpinSnapshot, onUnpinned } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })

    // Fire the handler the pin registered, as the runner's ✕ unpin would.
    const onExternalUnpin = onUnpinned.firstCall.args[0] as () => void

    onExternalUnpin()

    expect(restoreDom).to.have.been.calledOnceWith('ORIGINAL-DOM')
    // The store already reset itself on the external unpin — we must not unpin again.
    expect(unpinSnapshot).not.to.have.been.called

    // The pin is released, so a fresh pin lands cleanly.
    const outcome = await manager.exec('pin', { test: 'r2', command: '1' })

    expect((outcome as { result: any }).result.pinned.command.id).to.eq('1')
  })

  it('drops the pin without restoring when --clear arrives while a spec is running', async () => {
    const { restoreDom, unpinSnapshot, stopListening, isRunning } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })
    isRunning.returns(true)

    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    // The pin record is released, but the run owns the AUT — never restore over it.
    expect(cleared).to.deep.eq({ result: { cleared: false } })
    expect(restoreDom).not.to.have.been.called
    expect(unpinSnapshot).not.to.have.been.called
    expect(stopListening).to.have.been.calledOnce
  })

  it('drops the pin without restoring when --clear arrives while the runner is being replaced', async () => {
    const { getRunner, restoreDom, unpinSnapshot, stopListening } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })
    getRunner.returns(undefined)

    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    expect(cleared).to.deep.eq({ result: { cleared: false } })
    expect(restoreDom).not.to.have.been.called
    expect(unpinSnapshot).not.to.have.been.called
    expect(stopListening).to.have.been.calledOnce
  })

  it('drops the pin without restoring when an external unpin fires while a spec is running', async () => {
    const { restoreDom, onUnpinned, isRunning } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })
    isRunning.returns(true)

    const onExternalUnpin = onUnpinned.firstCall.args[0] as () => void

    onExternalUnpin()

    expect(restoreDom).not.to.have.been.called
  })

  it('drops the pin without restoring when an external unpin fires while the runner is being replaced', async () => {
    const { getRunner, restoreDom, onUnpinned } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })
    getRunner.returns(undefined)

    const onExternalUnpin = onUnpinned.firstCall.args[0] as () => void

    onExternalUnpin()

    expect(restoreDom).not.to.have.been.called
  })

  it('run-state reports the pin — with its reporter row — once verified against a live runner', async () => {
    stubSource()
    cy.stub(tapManagerDataSource, 'getRunner').returns({
      getAllTestsState: () => ({}),
      getTestState: (id: string) => TESTS_STATE[id as keyof typeof TESTS_STATE],
      isRunComplete: () => true,
    })

    cy.stub(tapManagerDataSource, 'getActiveSpecRelative').returns('cypress/e2e/login.cy.ts')

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })

    const outcome = await manager.exec('run-state')

    expect((outcome as { result: any }).result.pinned).to.deep.eq({
      test: 'r2',
      at: { index: 2, total: 2, name: 'after' },
      command: { id: '1', name: 'get', message: '#status', state: 'passed', type: 'parent' },
    })
  })

  it('run-state omits the pin while there is no runner to verify it against (runner being replaced)', async () => {
    stubSource()
    cy.stub(tapManagerDataSource, 'getRunner').returns(undefined)

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })

    expect(await manager.exec('run-state')).to.deep.eq({ result: { spec: null, totalSpecs: 0 } })
  })

  it('treats --clear with nothing pinned as an idempotent no-op', async () => {
    const { restoreDom, unpinSnapshot } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { clear: 'true' })

    expect(outcome).to.deep.eq({ result: { cleared: false } })
    expect(restoreDom).not.to.have.been.called
    expect(unpinSnapshot).not.to.have.been.called
  })

  it('auto-releases a stale pin when its command no longer resolves (spec switch / re-run), without restoring stale DOM', async () => {
    const getSnapshotPropsForLog = cy.stub().returns(SNAPSHOT_PROPS)

    cy.stub(tapManagerDataSource, 'getSnapshotRunner').returns({ getTestState: (id: string) => TESTS_STATE[id as keyof typeof TESTS_STATE], getSnapshotPropsForLog })

    const restoreDom = cy.stub()

    cy.stub(tapManagerDataSource, 'getAutIframe').returns({ detachDom: cy.stub().returns('ORIGINAL-DOM'), restoreDom })
    cy.stub(tapManagerDataSource, 'isRunning').returns(false)

    const pinSnapshot = cy.stub(tapManagerDataSource, 'pinSnapshot')

    cy.stub(tapManagerDataSource, 'unpinSnapshot')
    cy.stub(tapManagerDataSource, 'onSnapshotUnpinned').returns(cy.stub())

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })
    expect(pinSnapshot).to.have.been.calledOnce // the pin was rendered via the app pin

    // Simulate a re-run: the command id is reused, but its snapshots are fresh
    // objects — so identity no longer matches the object we pinned.
    getSnapshotPropsForLog.returns({ url: SNAPSHOT_PROPS.url, snapshots: [{ name: 'before' }, { name: 'after' }] })

    // Reconciliation drops the stale pin, so clear is a no-op that does NOT
    // restore the now-stale original DOM.
    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    expect(cleared).to.deep.eq({ result: { cleared: false } })
    expect(restoreDom).not.to.have.been.called // never a stale restore
  })

  it('drops a stale pin without restoring when an external unpin fires after a re-run', async () => {
    const getSnapshotPropsForLog = cy.stub().returns(SNAPSHOT_PROPS)

    cy.stub(tapManagerDataSource, 'getSnapshotRunner').returns({ getTestState: (id: string) => TESTS_STATE[id as keyof typeof TESTS_STATE], getSnapshotPropsForLog })

    const restoreDom = cy.stub()

    cy.stub(tapManagerDataSource, 'getAutIframe').returns({ detachDom: cy.stub().returns('ORIGINAL-DOM'), restoreDom })
    cy.stub(tapManagerDataSource, 'isRunning').returns(false)
    cy.stub(tapManagerDataSource, 'pinSnapshot')
    cy.stub(tapManagerDataSource, 'unpinSnapshot')

    const onUnpinned = cy.stub(tapManagerDataSource, 'onSnapshotUnpinned').returns(cy.stub())

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r2', command: '1' })

    // Simulate a re-run: the command id is reused, but its snapshots are fresh
    // objects — the captured DOM now belongs to the dead run.
    getSnapshotPropsForLog.returns({ url: SNAPSHOT_PROPS.url, snapshots: [{ name: 'before' }, { name: 'after' }] })

    // The unpin listener outlives the re-run until a tap command reconciles; a
    // pin/unpin in the new run fires it while our pin is stale.
    const onExternalUnpin = onUnpinned.firstCall.args[0] as () => void

    onExternalUnpin()

    expect(restoreDom).not.to.have.been.called // never a stale restore over the live AUT

    // The stale pin was released, so a fresh pin lands cleanly.
    const outcome = await manager.exec('pin', { test: 'r2', command: '1' })

    expect((outcome as { result: any }).result.pinned.command.id).to.eq('1')
  })

  it('requires a test and command (or --clear) before attempting a pin', async () => {
    const { detachDom, pinSnapshot } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('PIN_TARGET_REQUIRED')
    // A malformed pin never touches the iframe or drives the app pin.
    expect(detachDom).not.to.have.been.called
    expect(pinSnapshot).not.to.have.been.called
  })

  it('fails with NO_RUN when no runner has mounted', async () => {
    stubSource({ runner: undefined })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: '1' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('NO_RUN')
  })

  it('refuses to pin while a spec is running', async () => {
    stubSource({ running: true })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: '1' })

    expect((outcome as { error: { code: string, message: string } }).error).to.deep.eq({
      code: 'RUN_IN_PROGRESS',
      message: 'a spec is currently running — call `cypress tap status` to check its current status; wait for it to finish before trying again',
    })
  })

  it('fails with TEST_NOT_FOUND and COMMAND_NOT_FOUND for unknown ids', async () => {
    stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    expect((await manager.exec('pin', { test: 'nope', command: '1' }) as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')
    expect((await manager.exec('pin', { test: 'r2', command: '9' }) as { error: { code: string } }).error.code).to.eq('COMMAND_NOT_FOUND')
  })

  // Numbers restart per hook section, so a plain handle can be duplicated —
  // resolution prefers the test body, accepts a `<hookId>:<number>` qualifier,
  // and refuses to guess between hooks.
  const HOOKED_STATE = {
    r5: {
      id: 'r5',
      title: 'with hooks',
      state: 'passed',
      timings: { 'before each': [{ hookId: 'h1' }, { hookId: 'h2' }], test: { fnDuration: 1 } },
      commands: [
        { id: 'log-h1a', name: 'visit', message: '/a', state: 'passed', type: 'parent', hookId: 'h1' },
        { id: 'log-h1b', name: 'get', message: '#a', state: 'passed', type: 'parent', hookId: 'h1' },
        { id: 'log-h2a', name: 'visit', message: '/b', state: 'passed', type: 'parent', hookId: 'h2' },
        { id: 'log-h2b', name: 'get', message: '#b', state: 'passed', type: 'parent', hookId: 'h2' },
        { id: 'log-t1', name: 'get', message: '#x', state: 'passed', type: 'parent', hookId: 'r5' },
      ],
    },
  }

  const stubHookedSource = () => {
    return stubSource({ runner: {
      getTestState: (id: string) => HOOKED_STATE[id as keyof typeof HOOKED_STATE],
      getSnapshotPropsForLog: () => SNAPSHOT_PROPS,
    } })
  }

  it('resolves a duplicated plain number to the test body row', async () => {
    const { pinSnapshot } = stubHookedSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r5', command: '1' })

    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 1, 'r5', 'log-t1')
    expect((outcome as { result: any }).result.pinned.command.id).to.eq('1')
  })

  it('resolves a hook-qualified handle to that section’s row', async () => {
    const { pinSnapshot } = stubHookedSource()

    await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r5', command: 'h2:1' })

    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 1, 'r5', 'log-h2a')
  })

  it('refuses to guess between hooks: a number duplicated outside the test body is AMBIGUOUS_COMMAND', async () => {
    const { pinSnapshot } = stubHookedSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r5', command: '2' })

    expect(outcome).to.deep.eq({
      error: {
        code: 'AMBIGUOUS_COMMAND',
        message: '"2" matches h1:2 (before each) and h2:2 (before each) — qualify the id with its section, e.g. "h1:2"',
      },
    })

    expect(pinSnapshot).not.to.have.been.called
  })

  it('fails with COMMAND_NOT_FOUND for a qualifier that matches no section', async () => {
    stubHookedSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r5', command: 'h9:1' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('COMMAND_NOT_FOUND')
  })

  it('fails with SNAPSHOT_UNAVAILABLE when the command has no snapshot', async () => {
    stubSource({ runner: {
      getTestState: (id: string) => TESTS_STATE[id as keyof typeof TESTS_STATE],
      getSnapshotPropsForLog: () => ({ snapshots: null }),
    } })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r2', command: '1' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('SNAPSHOT_UNAVAILABLE')
  })

  // Per-attempt ids restart from 1, so command `1` names a different log on each
  // attempt; --attempt must pick the right one (defaulting to the latest) rather
  // than always resolving against the latest and pinning the wrong snapshot.
  const RETRIED_STATE = {
    r6: {
      id: 'r6',
      title: 'flakes then passes',
      state: 'passed',
      prevAttempts: [
        { id: 'r6', state: 'failed', commands: [{ id: 'log-a1', name: 'get', message: '#first-try', state: 'failed', type: 'parent', hookId: 'r6' }] },
      ],
      commands: [{ id: 'log-a2', name: 'get', message: '#retry', state: 'passed', type: 'parent', hookId: 'r6' }],
    },
  }

  const stubRetriedSource = () => {
    return stubSource({ runner: {
      getTestState: (id: string) => RETRIED_STATE[id as keyof typeof RETRIED_STATE],
      getSnapshotPropsForLog: () => SNAPSHOT_PROPS,
    } })
  }

  it('resolves command ids against the latest attempt by default', async () => {
    const { pinSnapshot } = stubRetriedSource()

    await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r6', command: '1' })

    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 1, 'r6', 'log-a2')
  })

  it('resolves command ids against the attempt named by --attempt', async () => {
    const { pinSnapshot } = stubRetriedSource()

    await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r6', command: '1' }, { attempt: '1' })

    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 1, 'r6', 'log-a1')
  })

  it('fails with ATTEMPT_NOT_FOUND when --attempt is out of range', async () => {
    const { pinSnapshot } = stubRetriedSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', { test: 'r6', command: '1' }, { attempt: '5' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('ATTEMPT_NOT_FOUND')
    expect(pinSnapshot).not.to.have.been.called
  })

  it('re-pinning the same command id on a different attempt starts a fresh pin, not a move', async () => {
    const { pinSnapshot, changeSnapshotState, detachDom } = stubRetriedSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', { test: 'r6', command: '1' }, { attempt: '1' })
    await manager.exec('pin', { test: 'r6', command: '1' }, { attempt: '2' })

    expect(detachDom).to.have.been.calledOnce
    expect(changeSnapshotState).not.to.have.been.called
    expect(pinSnapshot).to.have.been.calledTwice
    expect(pinSnapshot.firstCall.args[3]).to.eq('log-a1')
    expect(pinSnapshot.secondCall.args[3]).to.eq('log-a2')
  })
})
