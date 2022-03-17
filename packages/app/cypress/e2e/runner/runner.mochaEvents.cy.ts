import EventEmitter from 'events'
import _ from 'lodash'
import { runSpec } from './support/spec-loader'
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

  bus.on('assert:cypress:in:cypress', (snapshot: CypressInCypressMochaEvent[]) => {
    const expected = snapshots[snapToCompare]
    const diff = deepDiff(snapshot, expected)

    if (Object.keys(diff).length) {
      console.error('snapshot:', JSON.stringify(snapshot, null, 2))
      console.error('Expected snapshots to be identical, but they were not. Difference:', diff)
    }

    expect(Object.keys(diff).length).to.eq(0)
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
      it.only('fail in [before]', (done) => {
        const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
          'src/cypress/runner tests finish with correct state hook failures fail in [before] #1', done)

        runSpec({
          fileName: 'fail-with-before.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })

      it('fail in [beforeEach]', (done) => {
        const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
          'src/cypress/runner tests finish with correct state hook failures fail in [beforeEach] #1', done)

        runSpec({
          fileName: 'fail-with-beforeEach.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })

      it('fail in [after]', (done) => {
        const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
          'src/cypress/runner tests finish with correct state hook failures fail in [after] #1', done)

        runSpec({
          fileName: 'fail-with-after.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })

      it('fail in [afterEach]', (done) => {
        const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
          'src/cypress/runner tests finish with correct state hook failures fail in [afterEach] #1', done)

        runSpec({
          fileName: 'fail-with-afterEach.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })
    })

    describe('mocha grep', () => {
      it('fail with [only]', (done) => {
        const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
          'src/cypress/runner tests finish with correct state mocha grep fail with [only] #1', done)

        runSpec({
          fileName: 'fail-with-only.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })

      it('pass with [only]', (done) => {
        const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
          'src/cypress/runner tests finish with correct state mocha grep pass with [only] #1', done)

        runSpec({
          fileName: 'pass-with-only.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })
    })
  })

  describe('mocha events', () => {
    it('simple single test', (done) => {
      const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
        'src/cypress/runner mocha events simple single test #1', done)

      runSpec({
        fileName: 'simple-single-test.mochaEvents.cy.js',
      }).then((win) => {
        assertMatchingSnapshot(win)
      })
    })

    it('simple three tests', (done) => {
      const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
        'src/cypress/runner mocha events simple three tests #1', done)

      runSpec({
        fileName: 'three-tests-with-hooks.mochaEvents.cy.js',
      }).then((win) => {
        assertMatchingSnapshot(win)
      })
    })
  })
})
