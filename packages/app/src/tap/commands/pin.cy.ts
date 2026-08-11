import { TapManager } from '../tap-manager'
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
    const isRunning = cy.stub(tapManagerDataSource, 'isRunning').returns(over.running ?? false)

    // Stands in for the app's snapshot store, where every pin lands and which the
    // command reads back as the pin — `pinInApp` is a click in the reporter, and
    // `unpinInApp` is any app-side release, including the reset on a re-run.
    let showing: { testId: string, logId: string, index: number } | undefined

    const pinInApp = (logId: string, index = 0, testId = 'r2') => {
      showing = { testId, logId, index }
    }

    const unpinInApp = () => {
      showing = undefined
    }

    cy.stub(tapManagerDataSource, 'getPinnedSnapshot').callsFake(() => showing)

    const pinSnapshot = cy.stub(tapManagerDataSource, 'pinSnapshot').callsFake((_props, index, testId, logId) => pinInApp(logId, index, testId))
    const changeSnapshotState = cy.stub(tapManagerDataSource, 'changeSnapshotState').callsFake((index) => showing && pinInApp(showing.logId, index, showing.testId))
    const unpinSnapshot = cy.stub(tapManagerDataSource, 'unpinSnapshot').callsFake(unpinInApp)

    return { getRunner, pinSnapshot, changeSnapshotState, unpinSnapshot, isRunning, pinInApp, unpinInApp }
  }

  it('pins the last snapshot by default, driving the app pin', async () => {
    const { pinSnapshot } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })

    // Default --at is the last snapshot (the command's final state), index 1.
    // The tap id '1' resolved to the driver log id, which is what the app pin
    // and reporter key on.
    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 1, 'r2', 'log-1')

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

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r2', 'command-id': '1', at: 'before' })

    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 0, 'r2', 'log-1')
    expect((outcome as { result: any }).result.pinned.at).to.deep.eq({ index: 1, total: 2, name: 'before' })
  })

  it('fails with SNAPSHOT_NOT_FOUND when --at matches nothing, without driving the app pin', async () => {
    const { pinSnapshot } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r2', 'command-id': '1', at: 'during' })

    expect(outcome).to.deep.eq({
      error: { code: 'SNAPSHOT_NOT_FOUND', detail: 'Looked for `--at` "during". This command has: "before" (1), "after" (2).' },
    })

    expect(pinSnapshot).not.to.have.been.called
  })

  it('switches to a different command by re-pinning it', async () => {
    const { pinSnapshot, unpinSnapshot } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })
    const switched = await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '2' })

    expect((switched as { result: any }).result.pinned.command.id).to.eq('2')
    expect(pinSnapshot).to.have.been.calledTwice
    expect(pinSnapshot.secondCall.args[3]).to.eq('log-2')

    await manager.exec('pin', {}, { clear: 'true' })
    expect(unpinSnapshot).to.have.been.calledOnce
  })

  it('leaves the existing pin intact when a switch to another command fails validation', async () => {
    const { unpinSnapshot } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })
    const failed = await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '2', at: 'during' })

    expect((failed as { error: { code: string } }).error.code).to.eq('SNAPSHOT_NOT_FOUND')

    // The failed switch touched nothing — the '1' pin is still the one showing,
    // proven by a clear that releases it rather than a no-op.
    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    expect(cleared).to.deep.eq({ result: { cleared: true } })
    expect(unpinSnapshot).to.have.been.calledOnce
  })

  it('re-pinning the same command with a new --at moves the pin in place', async () => {
    const { pinSnapshot, changeSnapshotState } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    // First pin lands on the last snapshot (index 1, "after").
    await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })
    const moved = await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1', at: 'before' })

    // The move re-selects the snapshot in place: no re-pin, only a state switch
    // to "before" (index 0).
    expect(pinSnapshot).to.have.been.calledOnce
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

    await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })
    const outcome = await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1', at: 'during' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('SNAPSHOT_NOT_FOUND')
    // The pin never moved, so no state switch happened.
    expect(changeSnapshotState).not.to.have.been.called
  })

  it('re-pinning the same log id on another test starts a fresh pin, not a move', async () => {
    const testsState = {
      ...TESTS_STATE,
      r3: {
        id: 'r3',
        title: 'signs out',
        state: 'passed',
        commands: [{ id: 'log-1', name: 'get', message: '#account', state: 'passed', type: 'parent' }],
      },
    }
    const getTestState = (id: string) => testsState[id as keyof typeof testsState]
    const { pinSnapshot, changeSnapshotState } = stubSource({ runner: { getTestState, getSnapshotPropsForLog: () => SNAPSHOT_PROPS } })

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })
    const outcome = await manager.exec('pin', {}, { 'test-id': 'r3', 'command-id': '1' })

    // A log id names a row only within its test, so the app pin has to be
    // re-keyed onto the other test rather than moved within the one it holds.
    expect(changeSnapshotState).not.to.have.been.called
    expect(pinSnapshot).to.have.been.calledTwice
    expect(pinSnapshot.secondCall.args[2]).to.eq('r3')

    expect((outcome as { result: any }).result.pinned).to.deep.eq({
      test: 'r3',
      at: { index: 2, total: 2, name: 'after' },
      command: { id: '1', name: 'get', message: '#account', state: 'passed', type: 'parent' },
    })
  })

  it('clears a pin through the app’s own unpin, then a fresh pin lands', async () => {
    const { unpinSnapshot } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })
    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    // The app's unpin is the whole release — it restores the page the pin
    // detached, so the command has no DOM of its own to put back.
    expect(unpinSnapshot).to.have.been.calledOnce
    expect(cleared).to.deep.eq({ result: { cleared: true } })

    const outcome = await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })

    expect((outcome as { result: any }).result.pinned.command.id).to.eq('1')
  })

  it('reports nothing to release once the app has dropped the pin (the ✕, or a re-run resetting the store)', async () => {
    const { unpinSnapshot, unpinInApp } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })
    unpinInApp()

    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    expect(cleared).to.deep.eq({ result: { cleared: false } })
    // Already released app-side — unpinning again would be the command's own doing.
    expect(unpinSnapshot).not.to.have.been.called

    const outcome = await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })

    expect((outcome as { result: any }).result.pinned.command.id).to.eq('1')
  })

  it('never releases a pin while a spec is running — the run owns the AUT', async () => {
    const { unpinSnapshot, isRunning } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })
    isRunning.returns(true)

    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    expect(cleared).to.deep.eq({ result: { cleared: false } })
    expect(unpinSnapshot).not.to.have.been.called
  })

  it('reports nothing to release while the runner is being replaced', async () => {
    const { getRunner, unpinSnapshot } = stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })
    getRunner.returns(undefined)

    const cleared = await manager.exec('pin', {}, { clear: 'true' })

    expect(cleared).to.deep.eq({ result: { cleared: false } })
    expect(unpinSnapshot).not.to.have.been.called
  })

  it('run-state reports the pin — with its reporter row — once verified against a live runner', async () => {
    stubSource()
    cy.stub(tapManagerDataSource, 'getRunner').returns({
      getAllTestStates: () => ({}),
      getAllTestsSummary: () => ({}),
      getTestState: (id: string) => TESTS_STATE[id as keyof typeof TESTS_STATE],
      isRunComplete: () => true,
      getStartTime: () => '2026-07-29T10:15:00.000Z',
    })

    cy.stub(tapManagerDataSource, 'getActiveSpecRelative').returns('cypress/e2e/login.cy.ts')

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })

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

    await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })

    expect(await manager.exec('run-state')).to.deep.eq({ result: { spec: null, totalSpecs: 0 } })
  })

  // A pin made by hand in the reporter never reaches tap, so it is read back off
  // the app — an agent that cannot see it reads the pinned DOM as the live app.
  describe('a pin made in the reporter UI', () => {
    const stubStatusRunner = () => {
      cy.stub(tapManagerDataSource, 'getRunner').returns({
        getAllTestStates: () => Object.fromEntries(Object.entries(TESTS_STATE).map(([id, test]) => [id, test.state])),
        getAllTestsSummary: () => TESTS_STATE,
        getTestState: (id: string) => TESTS_STATE[id as keyof typeof TESTS_STATE],
        isRunComplete: () => true,
        getStartTime: () => '2026-07-29T10:15:00.000Z',
      })

      cy.stub(tapManagerDataSource, 'getActiveSpecRelative').returns('cypress/e2e/login.cy.ts')
    }

    it('is reported by run-state as its own reporter row', async () => {
      const { pinInApp } = stubSource()

      stubStatusRunner()
      pinInApp('log-2')

      const outcome = await new TapManager(CYPRESS_VERSION).exec('run-state')

      expect((outcome as { result: any }).result.pinned).to.deep.eq({
        test: 'r2',
        at: { index: 1, total: 2, name: 'before' },
        command: { id: '2', name: 'click', message: '', state: 'passed', type: 'child' },
      })
    })

    it('follows the snapshot the app is showing of it', async () => {
      const { pinInApp } = stubSource()

      stubStatusRunner()
      pinInApp('log-1', 1)

      const outcome = await new TapManager(CYPRESS_VERSION).exec('run-state')

      expect((outcome as { result: any }).result.pinned.at).to.deep.eq({ index: 2, total: 2, name: 'after' })
    })

    it('follows the snapshot the app is showing of a pin tap made, once the UI moves it', async () => {
      const { pinInApp } = stubSource()

      stubStatusRunner()

      const manager = new TapManager(CYPRESS_VERSION)

      await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })

      // The snapshot toggle over the AUT selects "before" — the app's index is the
      // one to report, whoever last set it.
      pinInApp('log-1', 0)

      const outcome = await manager.exec('run-state')

      expect((outcome as { result: any }).result.pinned.at).to.deep.eq({ index: 1, total: 2, name: 'before' })
    })

    it('is told apart from tap’s pin when another test reuses the same log id', async () => {
      const testsState = {
        ...TESTS_STATE,
        r3: {
          id: 'r3',
          title: 'signs out',
          state: 'passed',
          commands: [{ id: 'log-1', name: 'get', message: '#account', state: 'passed', type: 'parent' }],
        },
      }
      const getTestState = (id: string) => testsState[id as keyof typeof testsState]
      const { unpinSnapshot, pinInApp } = stubSource({ runner: { getTestState, getSnapshotPropsForLog: () => SNAPSHOT_PROPS } })

      cy.stub(tapManagerDataSource, 'getRunner').returns({
        getAllTestStates: () => Object.fromEntries(Object.entries(testsState).map(([id, test]) => [id, test.state])),
        getAllTestsSummary: () => testsState,
        getTestState,
        isRunComplete: () => true,
        getStartTime: () => '2026-07-29T10:15:00.000Z',
      })

      cy.stub(tapManagerDataSource, 'getActiveSpecRelative').returns('cypress/e2e/login.cy.ts')

      const manager = new TapManager(CYPRESS_VERSION)

      await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })
      // A log id resolves only within its test, so the pin is the other test's row.
      pinInApp('log-1', 0, 'r3')

      const outcome = await manager.exec('run-state')

      expect((outcome as { result: any }).result.pinned).to.deep.eq({
        test: 'r3',
        at: { index: 1, total: 2, name: 'before' },
        command: { id: '1', name: 'get', message: '#account', state: 'passed', type: 'parent' },
      })

      expect(await manager.exec('pin', {}, { clear: 'true' })).to.deep.eq({ result: { cleared: true } })
      expect(unpinSnapshot).to.have.been.calledOnce
    })

    it('is released by --clear through the app’s own unpin', async () => {
      const { unpinSnapshot, pinInApp } = stubSource()

      pinInApp('log-1')

      const cleared = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { clear: 'true' })

      expect(cleared).to.deep.eq({ result: { cleared: true } })
      expect(unpinSnapshot).to.have.been.calledOnce
    })

    it('is moved in place when tap re-pins its command with a new --at', async () => {
      const { pinSnapshot, changeSnapshotState, pinInApp } = stubSource()

      pinInApp('log-1', 1)

      const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r2', 'command-id': '1', at: 'before' })

      // The pin the app holds is the pin, whoever made it, so --at moves this one
      // rather than replacing it.
      expect(changeSnapshotState).to.have.been.calledOnceWith(0)
      expect(pinSnapshot).not.to.have.been.called
      expect((outcome as { result: any }).result.pinned.at).to.deep.eq({ index: 1, total: 2, name: 'before' })
    })

    it('replaces tap’s pin when it lands on another command', async () => {
      const { changeSnapshotState, pinSnapshot, unpinSnapshot, pinInApp } = stubSource()

      stubStatusRunner()

      const manager = new TapManager(CYPRESS_VERSION)

      await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })

      // Clicking another command in the reporter re-pins with no unpin event, so
      // the command that was pinned no longer describes the AUT.
      pinInApp('log-2')

      const outcome = await manager.exec('run-state')

      expect((outcome as { result: any }).result.pinned.command.id).to.eq('2')

      // --at on the superseded command is a fresh pin of it, not a move of the
      // command the app is showing.
      await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '1', at: 'before' })
      expect(changeSnapshotState).not.to.have.been.called
      expect(pinSnapshot).to.have.been.calledTwice

      const cleared = await manager.exec('pin', {}, { clear: 'true' })

      expect(cleared).to.deep.eq({ result: { cleared: true } })
      expect(unpinSnapshot).to.have.been.calledOnce
    })

    it('is not reported once the command it pinned has fallen out of memory', async () => {
      const { pinInApp } = stubSource({ runner: {
        getTestState: (id: string) => TESTS_STATE[id as keyof typeof TESTS_STATE],
        getSnapshotPropsForLog: () => ({ snapshots: [null, null] }),
      } })

      stubStatusRunner()
      pinInApp('log-1')

      const outcome = await new TapManager(CYPRESS_VERSION).exec('run-state')

      expect((outcome as { result: any }).result).to.not.have.property('pinned')
    })
  })

  it('treats --clear with nothing pinned as an idempotent no-op', async () => {
    const { unpinSnapshot } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { clear: 'true' })

    expect(outcome).to.deep.eq({ result: { cleared: false } })
    expect(unpinSnapshot).not.to.have.been.called
  })

  it('requires a test and command (or --clear) before attempting a pin', async () => {
    const { pinSnapshot } = stubSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r2' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('PIN_TARGET_REQUIRED')
    // A malformed pin never drives the app pin.
    expect(pinSnapshot).not.to.have.been.called
  })

  it('fails with SPEC_NOT_STARTED when no runner has mounted', async () => {
    stubSource({ runner: undefined })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('SPEC_NOT_STARTED')
  })

  it('refuses to pin while a spec is running, naming the spec to wait on', async () => {
    stubSource({ running: true })
    cy.stub(tapManagerDataSource, 'getActiveSpecRelative').returns('cypress/e2e/slow.cy.js')

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })

    expect((outcome as { error: { code: string, detail: string } }).error).to.deep.eq({
      code: 'SPEC_IN_PROGRESS',
      detail: 'The spec cypress/e2e/slow.cy.js is currently running.',
    })
  })

  it('fails with TEST_NOT_FOUND and COMMAND_NOT_FOUND for unknown ids', async () => {
    stubSource()

    const manager = new TapManager(CYPRESS_VERSION)

    expect((await manager.exec('pin', {}, { 'test-id': 'nope', 'command-id': '1' }) as { error: { code: string } }).error.code).to.eq('TEST_NOT_FOUND')
    expect((await manager.exec('pin', {}, { 'test-id': 'r2', 'command-id': '9' }) as { error: { code: string } }).error.code).to.eq('COMMAND_NOT_FOUND')
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

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r5', 'command-id': '1' })

    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 1, 'r5', 'log-t1')
    expect((outcome as { result: any }).result.pinned.command.id).to.eq('1')
  })

  it('resolves a hook-qualified handle to that section’s row', async () => {
    const { pinSnapshot } = stubHookedSource()

    await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r5', 'command-id': 'h2:1' })

    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 1, 'r5', 'log-h2a')
  })

  it('refuses to guess between hooks: a number duplicated outside the test body is AMBIGUOUS_COMMAND', async () => {
    const { pinSnapshot } = stubHookedSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r5', 'command-id': '2' })

    expect(outcome).to.deep.eq({
      error: {
        code: 'AMBIGUOUS_COMMAND',
        detail: '"2" matches h1:2 (before each) and h2:2 (before each) — e.g. "h1:2".',
      },
    })

    expect(pinSnapshot).not.to.have.been.called
  })

  it('fails with COMMAND_NOT_FOUND for a qualifier that matches no section', async () => {
    stubHookedSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r5', 'command-id': 'h9:1' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('COMMAND_NOT_FOUND')
  })

  it('fails with SNAPSHOT_UNAVAILABLE when the command has no snapshot', async () => {
    stubSource({ runner: {
      getTestState: (id: string) => TESTS_STATE[id as keyof typeof TESTS_STATE],
      getSnapshotPropsForLog: () => ({ snapshots: null }),
    } })

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r2', 'command-id': '1' })

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

    await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r6', 'command-id': '1' })

    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 1, 'r6', 'log-a2')
  })

  it('resolves command ids against the attempt named by --attempt', async () => {
    const { pinSnapshot } = stubRetriedSource()

    await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r6', 'command-id': '1', attempt: '1' })

    expect(pinSnapshot).to.have.been.calledOnceWith({ url: SNAPSHOT_PROPS.url, snapshots: SNAPSHOTS }, 1, 'r6', 'log-a1')
  })

  it('fails with ATTEMPT_NOT_FOUND when --attempt is out of range', async () => {
    const { pinSnapshot } = stubRetriedSource()

    const outcome = await new TapManager(CYPRESS_VERSION).exec('pin', {}, { 'test-id': 'r6', 'command-id': '1', attempt: '5' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('ATTEMPT_NOT_FOUND')
    expect(pinSnapshot).not.to.have.been.called
  })

  it('re-pinning the same command id on a different attempt starts a fresh pin, not a move', async () => {
    const { pinSnapshot, changeSnapshotState } = stubRetriedSource()

    const manager = new TapManager(CYPRESS_VERSION)

    await manager.exec('pin', {}, { 'test-id': 'r6', 'command-id': '1', attempt: '1' })
    await manager.exec('pin', {}, { 'test-id': 'r6', 'command-id': '1', attempt: '2' })

    // Each attempt has its own log, so this is a fresh pin, not a snapshot move.
    expect(changeSnapshotState).not.to.have.been.called
    expect(pinSnapshot).to.have.been.calledTwice
    expect(pinSnapshot.firstCall.args[3]).to.eq('log-a1')
    expect(pinSnapshot.secondCall.args[3]).to.eq('log-a2')
  })
})
