import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'
import { MobxRunnerStore } from '@packages/app/src/store/mobx-runner-store'

let runner: EventEmitter

const { _ } = Cypress

// builds a single suite with many failed tests, each with a large command log,
// so that tests far down the list are scrolled out of the reporter viewport
function buildRunnables (numTests: number, commandsPerTest: number): RootRunnable {
  const tests = _.times(numTests, (testIndex) => {
    const id = `r${testIndex + 3}`

    const commands = _.times(commandsPerTest, (commandIndex) => {
      return {
        id: `${id}-c${commandIndex}`,
        hookId: id,
        instrument: 'command',
        message: `assertion number ${commandIndex}`,
        name: 'assert',
        state: 'passed',
        testId: id,
        type: 'child',
      }
    })

    return {
      id,
      title: `failed test ${testIndex}`,
      state: 'failed',
      hooks: [],
      agents: [],
      routes: [],
      commands,
      err: {
        name: 'AssertionError',
        message: 'expected true to be false',
        stack: 'AssertionError: expected true to be false\n  at foo (bar.js:1:2)',
      },
    }
  })

  return {
    id: 'r1',
    title: '',
    root: true,
    hooks: [],
    tests: [],
    suites: [{
      id: 'r2',
      title: 'a suite of failing tests',
      root: false,
      hooks: [],
      tests,
    }],
  } as unknown as RootRunnable
}

function visitAndRenderReporter (runnables: RootRunnable) {
  runner = new EventEmitter()

  const runnerStore = new MobxRunnerStore('e2e')

  runnerStore.setSpec({
    name: 'foo.js',
    relative: 'relative/path/to/foo.js',
    absolute: '/absolute/path/to/foo.js',
  })

  cy.visit('/').then((win) => {
    // windowing out off-screen command logs only applies in run mode
    win.__CYPRESS_MODE__ = 'run'
    win.render({ runner, runnerStore })
  })

  cy.get('.reporter.mounted').then(() => {
    runner.emit('runnables:ready', runnables)
    runner.emit('reporter:start', {})

    // finish every test in run mode (isInteractive === false). Failed tests are
    // kept open and retain their command logs, which is the scenario that
    // regressed performance in https://github.com/cypress-io/cypress/issues/6881
    _.each(runnables.suites, (suite) => {
      _.each(suite.tests, (test) => {
        runner.emit('test:after:run', test, false)
      })
    })
  })
}

describe('windowing out off-screen command logs', () => {
  beforeEach(() => {
    visitAndRenderReporter(buildRunnables(15, 40))
  })

  it('renders the command log for a failed test that is in view', () => {
    cy.contains('failed test 0')
    .closest('.runnable')
    .find('.runnable-commands-region')
    .should('exist')
  })

  it('unmounts the command log for a failed test that is scrolled out of view', () => {
    // the last test is well below the fold, so its heavy command log should be
    // windowed out and replaced with a height-preserving placeholder
    cy.contains('failed test 14')
    .closest('.runnable')
    .as('offscreen')

    cy.get('@offscreen')
    .find('.windowed-out-content')
    .should('exist')

    cy.get('@offscreen')
    .find('.runnable-commands-region')
    .should('not.exist')
  })

  it('re-mounts the command log when the failed test is scrolled into view', () => {
    cy.contains('failed test 14')
    .closest('.runnable')
    .as('offscreen')

    // confirm it starts windowed out
    cy.get('@offscreen')
    .find('.windowed-out-content')
    .should('exist')

    // scrolling it into view should re-mount the real command log
    cy.contains('failed test 14').scrollIntoView()

    cy.get('@offscreen')
    .find('.runnable-commands-region')
    .should('exist')

    cy.get('@offscreen')
    .find('.windowed-out-content')
    .should('not.exist')

    // the failure error is rendered alongside the re-mounted command log
    cy.get('@offscreen')
    .find('.runnable-err')
    .should('exist')
  })
})
