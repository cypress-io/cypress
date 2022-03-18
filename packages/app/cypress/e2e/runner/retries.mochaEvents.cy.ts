import EventEmitter from 'events'
import { runSpec } from './support/spec-loader'
import { deepDiff, sanitizeMochaEvents } from './support/mochaEventsUtils'
import { snapshots } from './retries.mochaEvents.snapshots'
import type { CypressInCypressMochaEvent } from '../../../src/runner/event-manager'

declare global {
  interface Window {
    bus: EventEmitter
  }
}

function scaffoldCypressInCypressMochaEventsTest (snapToCompare: keyof typeof snapshots, done: Mocha.Done) {
  const bus = new EventEmitter()
  const outerRunner = window.top!.window

  outerRunner.bus = bus

  bus.on('assert:cypress:in:cypress', (snapshot: CypressInCypressMochaEvent[]) => {
    const expected = snapshots[snapToCompare]
    const diff = deepDiff(snapshot, expected)

    if (Object.keys(diff).length) {
      // useful for debugging
      console.error('snapshot:', JSON.stringify(snapshot, null, 2)) // eslint-disable-line no-console
      console.error('Expected snapshots to be identical, but they were not. Difference:', diff) // eslint-disable-line no-console
    }

    expect(Object.keys(diff).length).to.eq(0)
    done()
  })

  const assertMatchingSnapshot = (win: Cypress.AUTWindow) => {
    win.getEventManager().on('cypress:in:cypress:run:complete', (args: CypressInCypressMochaEvent[]) => {
      const data = sanitizeMochaEvents(args)

      bus.emit('assert:cypress:in:cypress', data)
    })
  }

  return { assertMatchingSnapshot }
}

describe('src/cypress/runner retries mochaEvents', { retries: 0 }, () => {
  // NOTE: for test-retries

  it('simple retry', (done) => {
    const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
      'src/cypress/runner retries mochaEvents simple retry #1', done,
    )

    runSpec({
      fileName: 'simple-fail.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('test retry with hooks', (done) => {
    const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
      'src/cypress/runner retries mochaEvents test retry with hooks #1', done,
    )

    runSpec({
      fileName: 'test-retry-with-hooks.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('test retry with hooks', (done) => {
    const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
      'src/cypress/runner retries mochaEvents test retry with hooks #1', done,
    )

    runSpec({
      fileName: 'test-retry-with-hooks.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('test retry with [only]', (done) => {
    const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
      'src/cypress/runner retries mochaEvents test retry with [only] #1', done,
    )

    runSpec({
      fileName: 'test-retry-with-only.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('can retry from [beforeEach]', (done) => {
    const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
      'src/cypress/runner retries mochaEvents can retry from [beforeEach] #1', done,
    )

    runSpec({
      fileName: 'can-retry-from-beforeEach.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('can retry from [afterEach]', (done) => {
    const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
      'src/cypress/runner retries mochaEvents can retry from [afterEach] #1', done,
    )

    runSpec({
      fileName: 'can-retry-from-afterEach.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('cant retry from [before]', (done) => {
    const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
      'src/cypress/runner retries mochaEvents cant retry from [before] #1', done,
    )

    runSpec({
      fileName: 'cant-retry-from-before.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('three tests with retry', (done) => {
    const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
      'src/cypress/runner retries mochaEvents three tests with retry #1', done,
    )

    runSpec({
      fileName: 'three-tests-with-retry.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  describe('cleanses errors before emitting', () => {
    it('does not try to serialize error with err.actual as DOM node', (done) => {
      const { assertMatchingSnapshot } = scaffoldCypressInCypressMochaEventsTest(
        'src/cypress/runner retries mochaEvents cleanses errors before emitting does not try to serialize error with err.actual as DOM node #1', done,
      )

      runSpec({
        fileName: 'does-not-serialize-dom-error.cy.js',
      }).then((win) => {
      // should not have err.actual, expected properties since the subject is a DOM element
        assertMatchingSnapshot(win)
      })
    })
  })
})
