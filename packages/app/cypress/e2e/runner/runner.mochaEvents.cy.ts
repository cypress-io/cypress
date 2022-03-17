import EventEmitter from 'events'
import _ from 'lodash'
import { loadSpec } from './support/spec-loader'
import { deepDiff, sanitizeMochaEvents } from './support/mochaEventsUtils'
import { snapshots } from './runner.mochaEvents.snapshots'
import type { CypressInCypressMochaEvent } from '../../../src/runner/event-manager'

declare global {
  interface Window {
    bus: EventEmitter
  }
}

// TODO: document how this works!
function scaffoldCypressInCypressMochaEventsTest (snapToCompare: keyof typeof snapshots, done: Mocha.Done) {
  const bus = new EventEmitter()
  const outerRunner = window.top!.window
  outerRunner.bus = bus

  bus.on('assert:cypress:in:cypress', (snapshot) => {
    const diff = deepDiff(snapshot, snapshots[snapToCompare])

    if (Object.keys(diff).length) {
      console.error('snapshot:', JSON.stringify(snapshot, null, 2))
      console.error('Expected snapshots to be identical, but they were not. Difference:', diff)
    }

    expect(Object.keys(diff)).to.have.lengthOf(0)
    done()
  })

  const assertMatchingSnapshot = (win: Cypress.AUTWindow) => {
    win.getEventManager().on('cypress:in:cypress:done' ,(args: CypressInCypressMochaEvent[]) => {
      const data = sanitizeMochaEvents(args)

      bus.emit('assert:cypress:in:cypress', data)
    })
  }

  return { assertMatchingSnapshot }
}

describe('src/cypress/runner', { retries: 0 }, () => {
  describe('tests finish with correct state', () => {
    describe('hook failures', () => {
      it('fail in [before]', (done) => {
        const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
          'src/cypress/runner tests finish with correct state hook failures fail in [before] #1', done)

        loadSpec({
          fileName: 'fail-with-before.mochaEvents.cy.js',
          passCount: 0,
          failCount: 1
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })

      it('fail in [beforeEach]', (done) => {
        const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
          'src/cypress/runner tests finish with correct state hook failures fail in [beforeEach] #1', done)

        loadSpec({
          fileName: 'fail-with-beforeEach.mochaEvents.cy.js',
          passCount: 0,
          failCount: 1
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })

      it('fail in [after]', (done) => {
        const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
          'src/cypress/runner tests finish with correct state hook failures fail in [after] #1', done)

        loadSpec({
          fileName: 'fail-with-after.mochaEvents.cy.js',
          passCount: 0,
          failCount: 1
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })

      it.only('fail in [afterEach]', (done) => {
        const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
          'src/cypress/runner tests finish with correct state hook failures fail in [afterEach] #1', done)

        loadSpec({
          fileName: 'fail-with-afterEach.mochaEvents.cy.js',
          passCount: 0,
          failCount: 1
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })
    })
  })
})

// mocha:start
// mocha:suite 
// mocha:suite 
// mocha:hook
// mocha test:before:run
// mocha fail
// mocha suite end 
// mocha test end 
// mocha test:after:run
// mocha suite end 
// mocha end 

// - runner:test:before:run:async
// - runner:runnable:after:run:async

// runner:start
// runner:suite:start 
// runner:suite:start
// runner:hook:start 
// runner:test:before:run 
// - runner:test:before:run:async
// - runner:runnable:after:run:async
// runner:fail
// runner:suite:end
// runner:test:end
// runner:test:after:run
// runner:suite:end
// runner:end