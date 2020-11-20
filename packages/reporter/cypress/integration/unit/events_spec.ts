import sinon, { SinonSpy, SinonStub } from 'sinon'

import events from '../../../src/lib/events'
import { AppState } from '../../../src/lib/app-state'
import { RunnablesStore } from '../../../src/runnables/runnables-store'
import { Scroller } from '../../../src/lib/scroller'
import { StatsStore } from '../../../src/header/stats-store'

interface RunnerStub {
  on: SinonSpy
  emit: SinonSpy
}

const runnerStub = (): RunnerStub => {
  return {
    on: sinon.stub(),
    emit: sinon.spy(),
  }
}

type AppStateStub = AppState & {
  startRunning: SinonSpy
  pause: SinonSpy
  reset: SinonSpy
  resume: SinonSpy
  end: SinonSpy
  temporarilySetAutoScrolling: SinonSpy
  setFirefoxGcInterval: SinonSpy
  setForcingGc: SinonSpy
  stop: SinonSpy
}

const appStateStub = () => {
  return {
    startRunning: sinon.spy(),
    pause: sinon.spy(),
    reset: sinon.spy(),
    resume: sinon.spy(),
    end: sinon.spy(),
    temporarilySetAutoScrolling: sinon.spy(),
    setFirefoxGcInterval: sinon.spy(),
    setForcingGc: sinon.spy(),
    stop: sinon.spy(),
  } as AppStateStub
}

type RunnablesStoreStub = RunnablesStore & {
  addLog: SinonSpy
  reset: SinonSpy
  runnableStarted: SinonSpy
  runnableFinished: SinonSpy
  setInitialScrollTop: SinonStub
  setRunnables: SinonSpy
  testById: SinonStub
  updateLog: SinonSpy
}

const runnablesStoreStub = () => {
  return {
    addLog: sinon.spy(),
    reset: sinon.spy(),
    runnableStarted: sinon.spy(),
    runnableFinished: sinon.spy(),
    setInitialScrollTop: sinon.stub(),
    setRunnables: sinon.spy(),
    testById: sinon.stub(),
    updateLog: sinon.spy(),
  } as RunnablesStoreStub
}

type ScrollerStub = Scroller & {
  getScrollTop: SinonStub
}

const scrollerStub = () => {
  return {
    getScrollTop: sinon.stub(),
  } as ScrollerStub
}

type StatsStoreStub = StatsStore & {
  incrementCount: SinonSpy
  pause: SinonSpy
  reset: SinonSpy
  resume: SinonSpy
  start: SinonSpy
  startRunning: SinonSpy
  end: SinonSpy
}

const statsStoreStub = () => {
  return {
    incrementCount: sinon.spy(),
    pause: sinon.spy(),
    reset: sinon.spy(),
    resume: sinon.spy(),
    start: sinon.spy(),
    startRunning: sinon.spy(),
    end: sinon.spy(),
  } as StatsStoreStub
}

describe('events', () => {
  let appState: AppStateStub
  let runnablesStore: RunnablesStoreStub
  let scroller: ScrollerStub
  let statsStore: StatsStoreStub
  let runner: RunnerStub

  beforeEach(() => {
    events.__off()

    appState = appStateStub()
    runnablesStore = runnablesStoreStub()
    scroller = scrollerStub()
    statsStore = statsStoreStub()
    events.init({ appState, runnablesStore, scroller, statsStore })

    runner = runnerStub()
    events.listen(runner)
  })

  context('from runner', () => {
    it('sets runnables on runnables:ready', () => {
      runner.on.withArgs('runnables:ready').callArgWith(1, 'root runnable')
      expect(runnablesStore.setRunnables).to.have.been.calledWith('root runnable')
    })

    it('adds log on reporter:log:add', () => {
      runner.on.withArgs('reporter:log:add').callArgWith(1, 'the log')
      expect(runnablesStore.addLog).to.have.been.calledWith('the log')
    })

    it('updates log on reporter:log:state:changed', () => {
      runner.on.withArgs('reporter:log:state:changed').callArgWith(1, 'the updated log')
      expect(runnablesStore.updateLog).to.have.been.calledWith('the updated log')
    })

    it('resets runnables on reporter:restart:test:run', () => {
      runner.on.withArgs('reporter:restart:test:run').callArgWith(1)
      expect(runnablesStore.reset).to.have.been.called
    })

    it('resets stats on reporter:restart:test:run', () => {
      runner.on.withArgs('reporter:restart:test:run').callArgWith(1)
      expect(statsStore.reset).to.have.been.called
    })

    it('resets appState on reporter:restart:test:run', () => {
      runner.on.withArgs('reporter:restart:test:run').callArgWith(1)
      expect(appState.reset).to.have.been.called
    })

    it('emits reporter:restarted on reporter:restart:test:run', () => {
      runner.on.withArgs('reporter:restart:test:run').callArgWith(1)
      expect(runner.emit).to.have.been.calledWith('reporter:restarted')
    })

    it('starts running stats on run:start if there are tests', () => {
      runnablesStore.hasTests = true
      runner.on.withArgs('run:start').callArgWith(1)
      expect(appState.startRunning).to.have.been.called
    })

    it('does not start running stats on run:start if there are no tests', () => {
      runnablesStore.hasTests = false
      runner.on.withArgs('run:start').callArgWith(1)
      expect(appState.startRunning).not.to.have.been.called
    })

    it('starts stats on reporter:start', () => {
      runnablesStore.hasTests = true
      runner.on.withArgs('reporter:start').callArgWith(1, {})
      expect(statsStore.start).to.have.been.calledWith({})
    })

    it('does not start stats if there are no tests on reporter:start', () => {
      runnablesStore.hasTests = false
      runner.on.withArgs('reporter:start').callArgWith(1, {})
      expect(statsStore.start).not.to.have.been.called
    })

    it('sets autoScrollingEnabled on the app state on reporter:start', () => {
      runner.on.withArgs('reporter:start').callArgWith(1, { autoScrollingEnabled: false })
      expect(appState.temporarilySetAutoScrolling).to.have.been.calledWith(false)
    })

    it('sets firefoxGcInterval on the app state on reporter:start', () => {
      runner.on.withArgs('reporter:start').callArgWith(1, { firefoxGcInterval: 111 })
      expect(appState.setFirefoxGcInterval).to.have.been.calledWith(111)
    })

    it('sets forcingGc & firefoxGcInterval on the app state on before:firefox:force:gc', () => {
      runner.on.withArgs('before:firefox:force:gc').callArgWith(1, { gcInterval: 222 })
      expect(appState.setFirefoxGcInterval).to.have.been.calledWith(222)
      expect(appState.setForcingGc).to.have.been.calledWith(true)
    })

    it('sets forcingGc & firefoxGcInterval on the app state on after:firefox:force:gc', () => {
      runner.on.withArgs('after:firefox:force:gc').callArgWith(1, { gcInterval: 333 })
      expect(appState.setFirefoxGcInterval).to.have.been.calledWith(333)
      expect(appState.setForcingGc).to.have.been.calledWith(false)
    })

    it('sets initial crollTop on the scroller on reporter:start', () => {
      runner.on.withArgs('reporter:start').callArgWith(1, { scrollTop: 123 })
      expect(runnablesStore.setInitialScrollTop).to.have.been.calledWith(123)
    })

    it('sends runnable started on test:before:run:async', () => {
      runner.on.withArgs('test:before:run:async').callArgWith(1, 'the runnable')
      expect(runnablesStore.runnableStarted).to.have.been.calledWith('the runnable')
    })

    it('sends runnable finished on test:after:run', () => {
      runner.on.withArgs('test:after:run').callArgWith(1, 'the runnable')
      expect(runnablesStore.runnableFinished).to.have.been.calledWith('the runnable')
    })

    it('increments the stats count on test:after:run if final: true', () => {
      runner.on.withArgs('test:after:run').callArgWith(1, { state: 'passed', final: true })
      expect(statsStore.incrementCount).to.have.been.calledWith('passed')
    })

    it('does not increment the stats count on test:after:run if not final: true', () => {
      runner.on.withArgs('test:after:run').callArgWith(1, { state: 'passed' })
      expect(statsStore.incrementCount).not.to.have.been.called
    })

    it('pauses the appState with next command name on paused', () => {
      runner.on.withArgs('paused').callArgWith(1, 'next command')
      expect(appState.pause).to.have.been.calledWith('next command')
    })

    it('pauses the stats on paused', () => {
      runner.on.withArgs('paused').callArgWith(1, 'next command')
      expect(statsStore.pause).to.have.been.called
    })

    it('ends the appState on run:end', () => {
      runner.on.withArgs('run:end').callArgWith(1)
      expect(appState.end).to.have.been.called
    })

    it('ends the stats on run:end', () => {
      runner.on.withArgs('run:end').callArgWith(1)
      expect(statsStore.end).to.have.been.called
    })

    it('calls callback with scrollTop and autoScrollingEnabled on reporter:collect:run:state', () => {
      const callback = sinon.spy()

      appState.autoScrollingEnabled = false
      scroller.getScrollTop.returns(321)
      runner.on.withArgs('reporter:collect:run:state').callArgWith(1, callback)
      expect(callback).to.have.been.calledWith({
        autoScrollingEnabled: false,
        scrollTop: 321,
      })
    })

    it('nullifies the appState pinned snapshot id on reporter:snapshot:unpinned', () => {
      appState.pinnedSnapshotId = 'c1'
      runner.on.withArgs('reporter:snapshot:unpinned').callArgWith(1)
      expect(appState.pinnedSnapshotId).to.be.null
    })
  })

  context('from local bus', () => {
    it('resumes the appState on resume', () => {
      events.emit('resume')
      expect(appState.resume).to.have.been.called
    })

    it('resumes the stats on resume', () => {
      events.emit('resume')
      expect(statsStore.resume).to.have.been.called
    })

    it('emits runner:resume on resume', () => {
      events.emit('resume')
      expect(runner.emit).to.have.been.calledWith('runner:resume')
    })

    it('emits runner:next on next', () => {
      events.emit('next')
      expect(runner.emit).to.have.been.calledWith('runner:next')
    })

    it('stops the appState on stop', () => {
      events.emit('stop')
      expect(appState.stop).to.have.been.called
    })

    it('emits runner:stop on stop', () => {
      events.emit('stop')
      expect(runner.emit).to.have.been.calledWith('runner:stop')
    })

    it('emits runner:restart on restart', () => {
      events.emit('restart')
      expect(runner.emit).to.have.been.calledWith('runner:restart')
    })

    it('emits runner:console:log on show:command', () => {
      events.emit('show:command', 'command id')
      expect(runner.emit).to.have.been.calledWith('runner:console:log', 'command id')
    })

    it('emits runner:console:error with test id on show:error', () => {
      const test = { err: { isCommandErr: false } }

      runnablesStore.testById.returns(test)
      events.emit('show:error', test)
      expect(runner.emit).to.have.been.calledWith('runner:console:error', {
        err: test.err,
        commandId: undefined,
      })
    })

    it('emits runner:console:error with test id and command id on show:error when it is a command error and there is a matching command', () => {
      const test = { err: { isCommandErr: true }, commandMatchingErr: () => {
        return { id: 'matching command id' }
      } }

      runnablesStore.testById.returns(test)
      events.emit('show:error', test)
      expect(runner.emit).to.have.been.calledWith('runner:console:error', {
        err: test.err,
        commandId: 'matching command id',
      })
    })

    it('emits runner:console:error with test id on show:error when it is a command error but there not a matching command', () => {
      const test = { err: { isCommandErr: true }, commandMatchingErr: () => {
        return null
      } }

      runnablesStore.testById.returns(test)
      events.emit('show:error', test)
      expect(runner.emit).to.have.been.calledWith('runner:console:error', {
        err: test.err,
        commandId: undefined,
      })
    })

    it('emits runner:show:snapshot on show:snapshot', () => {
      events.emit('show:snapshot', 'command id')
      expect(runner.emit).to.have.been.calledWith('runner:show:snapshot', 'command id')
    })

    it('emits runner:hide:snapshot on hide:snapshot', () => {
      events.emit('hide:snapshot', 'command id')
      expect(runner.emit).to.have.been.calledWith('runner:hide:snapshot', 'command id')
    })

    it('emits runner:pin:snapshot on pin:snapshot', () => {
      events.emit('pin:snapshot', 'command id')
      expect(runner.emit).to.have.been.calledWith('runner:pin:snapshot', 'command id')
    })

    it('emits runner:unpin:snapshot on unpin:snapshot', () => {
      events.emit('unpin:snapshot', 'command id')
      expect(runner.emit).to.have.been.calledWith('runner:unpin:snapshot', 'command id')
    })

    it('emits focus:tests on focus:tests', () => {
      events.emit('focus:tests')
      expect(runner.emit).to.have.been.calledWith('focus:tests')
    })

    it('emits save:state on save:state', () => {
      appState.autoScrollingEnabled = false
      events.emit('save:state')
      expect(runner.emit).to.have.been.calledWith('save:state', {
        autoScrollingEnabled: false,
      })
    })
  })
})
