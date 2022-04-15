import { getMochaEvents, assertEventNames } from './support/mochaEventsUtils'
import { snapshots } from './runner.mochaEvents.snapshots'

describe('src/cypress/runner', { retries: 0 }, () => {
  describe('tests finish with correct state', () => {
    describe('hook failures', () => {
      it('fail in [before]', (done) => {
        const filename = 'fail-with-before.mochaEvents.cy.js'

        getMochaEvents(filename, (events) => {
          assertEventNames(filename, snapshots[filename], events)
          done()
        })
      })

      it('fail in [beforeEach]', (done) => {
        const filename = 'fail-with-beforeEach.mochaEvents.cy.js'

        getMochaEvents(filename, (events) => {
          assertEventNames(filename, snapshots[filename], events)
          done()
        })
      })

      it('fail in [after]', (done) => {
        const filename = 'fail-with-after.mochaEvents.cy.js'

        getMochaEvents(filename, (events) => {
          assertEventNames(filename, snapshots[filename], events)
          done()
        })
      })

      it('fail in [afterEach]', (done) => {
        const filename = 'fail-with-afterEach.mochaEvents.cy.js'

        getMochaEvents(filename, (events) => {
          assertEventNames(filename, snapshots[filename], events)
          done()
        })
      })
    })

    describe('mocha grep', () => {
      it('fail with [only]', (done) => {
        const filename = 'fail-with-only.mochaEvents.cy.js'

        getMochaEvents(filename, (events) => {
          assertEventNames(filename, snapshots[filename], events)
          done()
        })
      })

      it('pass with [only]', (done) => {
        const filename = 'pass-with-only.mochaEvents.cy.js'

        getMochaEvents(filename, (events) => {
          assertEventNames(filename, snapshots[filename], events)
          done()
        })
      })
    })
  })
})
