import { getMochaEvents, assertEventNames } from './support/mochaEventsUtils'
import { snapshots } from './retries.mochaEvents.snapshots'

describe('src/cypress/runner retries mochaEvents', { retries: 0 }, () => {
  it('test retry with hooks', (done) => {
    const filename = 'test-retry-with-hooks.retries.mochaEvents.cy.js'

    getMochaEvents(filename, (events) => {
      assertEventNames(filename, snapshots[filename], events)
      done()
    })
  })

  it('test retry with [only]', (done) => {
    const filename = 'test-retry-with-only.retries.mochaEvents.cy.js'

    getMochaEvents(filename, (events) => {
      assertEventNames(filename, snapshots[filename], events)
      done()
    })
  })

  it('can retry from [beforeEach]', (done) => {
    const filename = 'can-retry-from-beforeEach.retries.mochaEvents.cy.js'

    getMochaEvents(filename, (events) => {
      assertEventNames(filename, snapshots[filename], events)
      done()
    })
  })

  it('can retry from [afterEach]', (done) => {
    const filename = 'can-retry-from-afterEach.retries.mochaEvents.cy.js'

    getMochaEvents(filename, (events) => {
      assertEventNames(filename, snapshots[filename], events)
      done()
    })
  })

  it('cant retry from [before]', (done) => {
    const filename = 'cant-retry-from-before.retries.mochaEvents.cy.js'

    getMochaEvents(filename, (events) => {
      assertEventNames(filename, snapshots[filename], events)
      done()
    })
  })

  it('cant retry from [after]', (done) => {
    const filename = 'cant-retry-from-after.retries.mochaEvents.cy.js'

    getMochaEvents(filename, (events) => {
      assertEventNames(filename, snapshots[filename], events)
      done()
    })
  })

  it('three tests with retry', (done) => {
    const filename = 'three-tests-with-retry.retries.mochaEvents.cy.js'

    getMochaEvents(filename, (events) => {
      assertEventNames(filename, snapshots[filename], events)
      done()
    })
  })

  // At the default timeout this test is flakey.
  it('does not try to serialize error with err.actual as DOM node', { defaultCommandTimeout: 10000 }, (done) => {
    const filename = 'does-not-serialize-dom-error.cy.js'

    getMochaEvents(filename, (events) => {
      assertEventNames(filename, snapshots[filename], events)

      // events[10] is the 'fail' event, the above assertion verifies that we have the correct one.
      // should not have err.actual, expected properties since the subject is a DOM element
      const errMsg = events[10][3]

      expect(errMsg.message).to.eql('Timed out retrying after 200ms: expected \'<button#button>\' not to be \'visible\'')
      expect(errMsg).not.to.have.property('actual')

      done()
    })
  })
})
