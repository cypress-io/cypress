/* eslint-disable no-console */

const fs = require('@packages/fs')
const path = require('path')
const chai = require('chai')
const debug = require('debug')
const sinon = require('sinon')
const dateString = require('chai-date-string')
const sinonChai = require('sinon-chai')
const logger = require('../')

chai.use(sinonChai)
chai.use(dateString)

const { expect } = chai

debug.inspectOpts.colors = false
debug.inspectOpts.hideDate = true

debug.enable('logger:spec')
const $logger = logger('logger:spec')

beforeEach(() => {
  // spy on the default debug log function
  // which writes to process.stderr
  sinon.spy(debug, 'log')

  sinon.spy(console, 'log')

  logger.reset()
})

afterEach(() => {
  sinon.restore()
})

describe('lib/logger', () => {
  context('.verbose', () => {
    it('proxies calls to debug(...)', () => {
      $logger('hai there')

      expect(debug.log).to.be.calledWith('logger:spec hai there')
    })

    it('can use a callback function', () => {
      $logger((d) => {
        d('hai there')

        expect(debug.log).to.be.calledOnce
        expect(debug.log).to.be.calledWith('logger:spec hai there')
      })
    })

    it('adds %o by default', () => {
      $logger('an object', { foo: 'bar' })

      expect(debug.log).to.be.calledWith('logger:spec an object { foo: \'bar\' }')
    })

    it('proxies calls to console.log', () => {
      logger.console('foo')
      expect(console.log).to.be.calledWith('foo')
      $logger.console('bar')
      expect(console.log).to.be.calledWith('bar')
      expect(console.log).to.be.calledTwice
    })
  })

  context('.silence', () => {
    beforeEach(() => {
      logger.silence()
    })

    it('does not write anything when silenced', () => {
      $logger('hai there')

      expect(debug.log).not.to.be.called
    })

    it('does not proxy calls to console.log', () => {
      logger.console('foo')
      $logger.console('bar')
      expect(debug.log).not.to.be.called
    })
  })

  context('.start', () => {
    const tmpPath = path.join('some', 'test', 'tmp', 'path')

    beforeEach(() => {
      return logger.start(tmpPath)
    })

    afterEach(() => {
      return fs.removeAsync(path.join('some'))
    })

    it('always creates an empty file', () => {
      return fs.statAsync(tmpPath)
      .then(() => {
        $logger('hey')
        $logger('ho')

        return logger.end()
        .then((fileLogger) => {
          return fileLogger
          .queryAsync()
          .then((results) => {
            expect(results).to.have.length(2)
          })
        })
      })
      .then(() => {
        return logger.start(tmpPath)
      })
      .then(() => {
        return fs.readFileAsync(path.join(tmpPath, 'debug.log'), 'utf8')
      })
      .then((contents) => {
        expect(contents).to.be.empty
      })
    })

    it('ends even without writing anything', () => {
      return logger.end()
      .then((fileLogger) => {
        return fileLogger
        .queryAsync()
        .then((results) => {
          expect(results).to.deep.eq([])
        })
      })
    })

    it('writes logs to file', () => {
      const date = (new Date(1986, 2, 14)).toJSON()

      $logger('foo bar', { baz: 'quux', something: undefined, another: null })
      $logger('timestamp override', { timestamp: date })
      $logger((d) => {
        d('as a callback function')
      })

      return logger.end()
      .then((fileLogger) => {
        return fileLogger
        .queryAsync()
        .then((results) => {
          expect(results[0].timestamp).to.be.a.dateString()
          expect(results[0].ms).to.be.within(0, 10)
          expect(results[1].ms).to.be.within(0, 10)
          expect(results[2].ms).to.be.within(0, 10)
          expect(results[2].timestamp).to.be.a.dateString()

          results[0].timestamp = 'a-date-string'
          results[2].timestamp = 'a-date-string2'

          results[0].ms = 1
          results[1].ms = 2
          results[2].ms = 3

          expect(results).to.deep.eq([
            {
              ms: 1,
              namespace: 'logger:spec',
              props: {
                baz: 'quux',
                another: null,
              },
              level: 'info',
              message: 'foo bar',
              timestamp: 'a-date-string',
            }, {
              ms: 2,
              namespace: 'logger:spec',
              level: 'info',
              message: 'timestamp override',
              timestamp: date,
            }, {
              ms: 3,
              namespace: 'logger:spec',
              level: 'info',
              message: 'as a callback function',
              timestamp: 'a-date-string2',
            },
          ])
        })
      })
    })

    it('writes even when debug is silenced and disabled', () => {
      logger.silence()

      const $writer = logger('writer:spec')

      debug.disable('writer:spec')

      $writer('hai there')

      return logger.end()
      .then((fileLogger) => {
        return fileLogger
        .queryAsync()
        .then((results) => {
          expect(results).to.have.length(1)
          expect(results[0].namespace).to.eq('writer:spec')
        })
      })
    })
  })
})
