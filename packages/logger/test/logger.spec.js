const { expect } = require('chai')
const debug = require('debug')
const logger = require('../')

debug.inspectOpts.colors = false
debug.inspectOpts.hideDate = true

describe('lib/logger', () => {
  beforeEach(() => {
    delete debug.log
  })

  context('enabled', () => {
    debug.enable('logger:spec')
    debug.useColors = () => false

    const $logger = logger('logger:spec')

    it('proxies calls to debug(...)', (done) => {
      debug.log = (str) => {
        expect(str).to.eq('logger:spec hai there')
        done()
      }

      $logger('hai there')
    })

    it('can use a callback function', (done) => {
      debug.log = () => {
        throw new Error('should not be called yet')
      }

      $logger((d) => {
        debug.log = (str) => {
          expect(str).to.eq('logger:spec hai there')
          done()
        }

        d('hai there')
      })
    })

    it('adds %o by default', (done) => {
      debug.log = (str) => {
        expect(str).to.eq('logger:spec an object { foo: \'bar\' }')
        done()
      }

      $logger('an object', { foo: 'bar' })
    })
  })
})
