import sinon, { SinonSpy } from 'sinon'

import runnablesStore, { RunnablesStore, RootRunnable, LogProps } from './runnables-store'
import SuiteModel, { SuiteProps } from './suite-model'

import { AppState } from '../lib/app-state'
import { Scroller } from '../lib/scroller'
import TestModel, { TestProps } from '../test/test-model'
import { AgentProps } from '../agents/agent-model'
import { CommandProps } from '../commands/command-model'
import { RouteProps } from '../routes/route-model'

const appStateStub = () => {
  return {
    isRunning: true,
    autoScrollingEnabled: true,
  } as AppState
}

type ScrollerStub = Scroller & {
  setScrollTop: SinonSpy
  scrollToEnd: SinonSpy
}

const scrollerStub = () => {
  return {
    setScrollTop: sinon.spy(),
    scrollToEnd: sinon.spy(),
  } as ScrollerStub
}

const createTest = (id: number) => {
  return { id, title: `test ${id}` } as TestProps
}
const createSuite = (id: number, tests: Array<TestProps>, suites: Array<SuiteProps>) => {
  return { id, title: `suite ${id}`, tests, suites } as SuiteProps
}
const createAgent = (id: number, testId: number) => {
  return { id, testId, instrument: 'agent' } as AgentProps
}
const createCommand = (id: number, testId: number) => {
  return { id, testId, instrument: 'command' } as CommandProps
}
const createRoute = (id: number, testId: number) => {
  return { id, testId, instrument: 'route' } as RouteProps
}

const createRootRunnable = () => {
  return {
    tests: [createTest(1)],
    suites: [
      createSuite(1, [createTest(2), createTest(3)], [
        createSuite(3, [createTest(4)], []), createSuite(4, [createTest(5)], []),
      ]),
      createSuite(2, [createTest(6)], []),
    ],
  } as RootRunnable
}

describe('runnables store', () => {
  let instance: RunnablesStore
  let appState: AppState
  let scroller: Scroller

  beforeEach(() => {
    global.requestAnimationFrame = (cb: (() => void)) => {
      return cb()
    }

    appState = appStateStub()
    scroller = scrollerStub()
    instance = new RunnablesStore({ appState, scroller })
  })

  it('exports singleton by default', () => {
    expect(runnablesStore).to.be.instanceof(RunnablesStore)
  })

  context('#setRunnables', () => {
    it('creates nested array of runnables', () => {
      instance.setRunnables(createRootRunnable())
      expect(instance.runnables.length).to.equal(3)
      expect(instance.runnables[0].title).to.equal('test 1')
      expect((instance.runnables[1] as SuiteModel).children.length).to.equal(4)
      expect((instance.runnables[2] as SuiteModel).children.length).to.equal(1)
    })

    it('sets the appropriate types', () => {
      instance.setRunnables(createRootRunnable())
      expect(instance.runnables[0].type).to.equal('test')
      expect(instance.runnables[1].type).to.equal('suite')
    })

    it('adds logs to tests when specified', () => {
      const rootRunnable = createRootRunnable()

      rootRunnable.tests![0].agents = [createAgent(1, 1), createAgent(2, 1), createAgent(3, 1)]
      rootRunnable.tests![0].commands = [createCommand(1, 1)]
      rootRunnable.tests![0].routes = [createRoute(1, 1), createRoute(2, 1)]
      instance.setRunnables(rootRunnable)
      expect((instance.runnables[0] as TestModel).agents.length).to.equal(3)
      expect((instance.runnables[0] as TestModel).commands.length).to.equal(1)
      expect((instance.runnables[0] as TestModel).routes.length).to.equal(2)
    })

    it('sets the appropriate nesting levels', () => {
      instance.setRunnables(createRootRunnable())
      expect(instance.runnables[0].level).to.equal(0)
      expect(instance.runnables[1].level).to.equal(0)
      expect((instance.runnables[1] as SuiteModel).children[0].level).to.equal(1)
      expect(((instance.runnables[1] as SuiteModel).children[2] as SuiteModel).children[0].level).to.equal(2)
    })

    it('sets .isReady flag', () => {
      instance.setRunnables({})
      expect(instance.isReady).to.be.true
    })

    it('sets .hasTests flag to true if there are tests', () => {
      instance.setRunnables(createRootRunnable())
      expect(instance.hasTests).to.be.true
    })

    it('sets .hasTests flag to false if there are no tests', () => {
      instance.setRunnables({ tests: [], suites: [createSuite(1, [], []), createSuite(2, [], [])] })
      expect(instance.hasTests).to.be.false
    })

    it('sets .hasSingleTest flag to true if there is only one test', () => {
      instance.setRunnables({ tests: [], suites: [createSuite(1, [], []), createSuite(2, [createTest(1)], [])] })
      expect(instance.hasSingleTest).to.be.true
    })

    it('sets .hasSingleTest flag to false if there are no tests', () => {
      instance.setRunnables({ tests: [], suites: [createSuite(1, [], []), createSuite(2, [], [])] })
      expect(instance.hasSingleTest).to.be.false
    })

    it('sets .hasSingleTest flag to false if there are multiple tests', () => {
      instance.setRunnables(createRootRunnable())
      expect(instance.hasSingleTest).to.be.false
    })

    it('starts rendering the runnables on requestAnimationFrame', () => {
      instance.setRunnables({ tests: [], suites: [createSuite(1, [], []), createSuite(2, [createTest(1)], [])] })
      expect(instance.runnables[0].shouldRender).to.be.true
      expect(instance.runnables[1].shouldRender).to.be.true
      expect((instance.runnables[1] as SuiteModel).children[0].shouldRender).to.be.true
    })

    it('sets scrollTop when app is running and initial scrollTop has been set', () => {
      instance.setInitialScrollTop(234)
      instance.setRunnables({})
      expect(scroller.setScrollTop).to.have.been.calledWith(234)
    })

    it('does nothing when app is running and initial scrollTop has not been set', () => {
      instance.setRunnables({})
      expect(scroller.setScrollTop).not.to.have.been.called
    })

    it('sets scrolls to end when app is not running and auto-scrolling is enabled', () => {
      appState.isRunning = false
      instance.setRunnables({})
      expect(scroller.scrollToEnd).to.have.been.called
    })

    it('does nothing when app is not running and auto-scrolling is disabled', () => {
      appState.isRunning = false
      appState.autoScrollingEnabled = false
      instance.setRunnables({})
      expect(scroller.scrollToEnd).not.to.have.been.called
    })

    it('does nothing when app is stopped and auto-scrolling is enabled', () => {
      appState.isRunning = false
      appState.isStopped = true
      instance.setRunnables({})
      expect(scroller.scrollToEnd).not.to.have.been.called
    })
  })

  context('#runnableStarted', () => {
    it('starts the test with the given id', () => {
      instance.setRunnables({ tests: [createTest(1)], suites: [] })
      instance.runnableStarted({ id: 1 } as TestModel)
      expect((instance.runnables[0] as TestModel).isActive).to.be.true
    })
  })

  context('#runnableFinished', () => {
    it('finishes the test with the given id', () => {
      instance.setRunnables({ tests: [createTest(1)], suites: [] })
      instance.runnableStarted({ id: 1 } as TestModel)
      instance.runnableFinished({ id: 1 } as TestModel)
      expect((instance.runnables[0] as TestModel).isActive).to.be.false
    })
  })

  context('#testByid', () => {
    it('returns the test with the given id', () => {
      instance.setRunnables({ tests: [createTest(1), createTest(3)], suites: [] })
      expect(instance.testById(3).title).to.be.equal('test 3')
    })
  })

  context('#updateLog', () => {
    it('updates the log', () => {
      instance.setRunnables({ tests: [createTest(1)] })
      instance.addLog(createCommand(1, 1))
      instance.updateLog({ id: 1, name: 'new name' } as LogProps)
      expect(instance.testById(1).commands[0].name).to.equal('new name')
    })
  })

  context('#reset', () => {
    it('resets flags to default values', () => {
      instance.setRunnables({ tests: [createTest(1)] })
      instance.attemptingShowSnapshot = true
      instance.showingSnapshot = true
      instance.reset()

      expect(instance.hasSingleTest).to.be.false
      expect(instance.hasTests).to.be.false
      expect(instance.isReady).to.be.false
      expect(instance.attemptingShowSnapshot).to.be.false
      expect(instance.showingSnapshot).to.be.false
    })

    it('resets runnables', () => {
      instance.setRunnables({ tests: [createTest(1)] })
      instance.reset()
      expect(instance.runnables.length).to.equal(0)
    })

    it('resets tests', () => {
      instance.setRunnables({ tests: [createTest(1)] })
      instance.reset()
      expect(instance.testById(1)).to.be.undefined
    })
  })
})
