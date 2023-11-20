const path = require('path')
const proxyquire = require('proxyquire').preserveCache()
const sinon = require('sinon')

describe('unhandled_exceptions: infinite loop guard', () => {
  const INFINITE_LOOP_GUARD = 5
  let errCount = 0

  function noop () {}

  beforeEach(() => {
    errCount = 0
    proxyquire(path.join(__dirname, '../../lib/unhandled_exceptions'), {
      './errors': {
        get logException () {
          errCount++
          if (errCount < INFINITE_LOOP_GUARD) {
            // simulate an unhandled exception in sentry
            throw new SyntaxError('Invalid file')
          }

          return () => {}
        },
      },
    })

    require('../../lib/unhandled_exceptions').handle()

    sinon.stub(process, 'exit').callsFake(() => {
      // Should only be hit if we hit the infinite loop
    })

    // Add additional listeners to prevent the test from exiting
    process.on('uncaughtException', noop)
    process.on('unhandledRejection', noop)
  })

  afterEach(() => {
    process.off('uncaughtException', noop)
    process.off('unhandledRejection', noop)
  })

  it('only binds once to the unhandledRejection / uncaughtException to prevent infinite loop in startup', (done) => {
    process.emit('uncaughtException', new Error('Some Error'))

    // Run for a few ms and check the number of loops through the unhandled exception path.
    // If it's more than a few, it means we are infinite looping because we didn't bind a .once
    // to the default uncaughtException / unhandledRejection handler
    setTimeout(() => {
      if (errCount < INFINITE_LOOP_GUARD) {
        done()
      } else {
        done(new Error('Infinite Loop Hit'))
      }
    }, 10)
  })
})
