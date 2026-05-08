delete global.fs

const api = require('../../../lib/cloud/api').default
const user = require('../../../lib/cloud/user').default
const exception = require('../../../lib/cloud/exception').default
const system = require('../../../lib/util/system')
const pkg = require('@packages/root')

describe('lib/cloud/exceptions', () => {
  context('.getAuthToken', () => {
    it('returns authToken from cache', () => {
      sinon.stub(user, 'get').resolves({ authToken: 'auth-token-123' })

      return exception.getAuthToken().then((authToken) => {
        expect(authToken).to.eq('auth-token-123')
      })
    })

    it('returns undefined if no authToken', () => {
      sinon.stub(user, 'get').resolves({})

      return exception.getAuthToken().then((authToken) => {
        expect(authToken).to.be.undefined
      })
    })
  })

  context('.getErr', () => {
    it('returns an object literal', () => {
      const err = new Error()

      expect(exception.getErr(err)).to.have.keys('name', 'message', 'stack')
    })

    describe('fields', () => {
      beforeEach(function () {
        try {
          // eslint-disable-next-line no-undef
          return foo.bar()
        } catch (err) {
          this.err = err
        }
      })

      it('has name', function () {
        const obj = exception.getErr(this.err)

        expect(obj.name).to.eq(this.err.name)
      })

      it('has message', function () {
        const obj = exception.getErr(this.err)

        expect(obj.message).to.eq(this.err.message)
      })

      it('has stack', function () {
        const obj = exception.getErr(this.err)

        expect(obj.stack).to.be.a('string')

        expect(obj.stack).to.include('foo is not defined')
      })
    })

    describe('path stripping', () => {
      beforeEach(function () {
        this.err = {
          name: 'Path not found: /Users/ruby/dev/',
          message: 'Could not find /Users/ruby/dev/foo.js',
          stack: `\
Error at /Users/ruby/dev/index.js:102
at foo /Users/ruby/dev/foo.js:4
at bar /Users/ruby/dev/bar.js:92\
`,
        }

        this.windowsError = {
          name: 'Path not found: \\Users\\ruby\\dev\\',
          message: 'Could not find \\Users\\ruby\\dev\\foo.js',
          stack: `\
Error at \\Users\\ruby\\dev\\index.js:102
at foo \\Users\\ruby\\dev\\foo.js:4
at bar \\Users\\ruby\\dev\\bar.js:92\
`,
        }
      })

      it('strips paths from name, leaving file name and line number', function () {
        expect(exception.getErr(this.err).name).to.equal('Path not found: <stripped-path>')

        expect(exception.getErr(this.windowsError).name).to.equal('Path not found: <stripped-path>')
      })

      it('strips paths from message, leaving file name and line number', function () {
        expect(exception.getErr(this.err).message).to.equal('Could not find <stripped-path>foo.js')

        expect(exception.getErr(this.windowsError).message).to.equal('Could not find <stripped-path>foo.js')
      })

      it('strips paths from stack, leaving file name and line number', function () {
        expect(exception.getErr(this.err).stack).to.equal(`\
Error at <stripped-path>index.js:102
at foo <stripped-path>foo.js:4
at bar <stripped-path>bar.js:92\
`)

        expect(exception.getErr(this.windowsError).stack).to.equal(`\
Error at <stripped-path>index.js:102
at foo <stripped-path>foo.js:4
at bar <stripped-path>bar.js:92\
`)
      })

      it('handles strippable properties being undefined gracefully', () => {
        expect(() => {
          return exception.getErr({})
        }).not.to.throw()
      })
    })
  })

  context('.getVersion', () => {
    it('returns version from package.json', () => {
      sinon.stub(pkg, 'version').value('0.1.2')

      expect(exception.getVersion()).to.eq('0.1.2')
    })
  })

  context('.getBody', () => {
    beforeEach(function () {
      this.err = new Error()
      sinon.stub(pkg, 'version').value('0.1.2')

      return sinon.stub(system, 'info').resolves({
        system: 'info',
      })
    })

    it('sets err', function () {
      return exception.getBody(this.err).then((body) => {
        expect(body.err).to.be.an('object')
      })
    })

    it('sets version', function () {
      return exception.getBody(this.err).then((body) => {
        expect(body.version).to.eq('0.1.2')
      })
    })

    it('sets system info', function () {
      return exception.getBody(this.err).then((body) => {
        expect(body.system).to.eq('info')
      })
    })
  })

  context('.create', () => {
    beforeEach(function () {
      this.env = process.env['CYPRESS_INTERNAL_ENV']

      return sinon.stub(api, 'createCrashReport')
    })

    afterEach(function () {
      process.env['CYPRESS_INTERNAL_ENV'] = this.env
    })

    describe('with CYPRESS_CRASH_REPORTS=0', () => {
      beforeEach(() => {
        return process.env['CYPRESS_CRASH_REPORTS'] = '0'
      })

      afterEach(() => {
        return delete process.env['CYPRESS_CRASH_REPORTS']
      })

      it('immediately resolves', () => {
        return exception.create()
        .then(() => {
          expect(api.createCrashReport).to.not.be.called
        })
      })
    })

    describe('development', () => {
      beforeEach(() => {
        return process.env['CYPRESS_INTERNAL_ENV'] = 'development'
      })

      it('immediately resolves', () => {
        return exception.create()
        .then(() => {
          expect(api.createCrashReport).to.not.be.called
        })
      })
    })

    describe('production', () => {
      beforeEach(function () {
        process.env['CYPRESS_INTERNAL_ENV'] = 'production'

        this.err = { name: 'ReferenceError', message: 'undefined is not a function', stack: 'asfd' }

        sinon.stub(exception, 'getBody').resolves({
          err: this.err,
          version: '0.1.2',
        })

        return sinon.stub(exception, 'getAuthToken').resolves('auth-token-123')
      })

      it('sends body + authToken to api.createCrashReport', function () {
        api.createCrashReport.resolves()

        return exception.create().then(() => {
          const body = {
            err: this.err,
            version: '0.1.2',
          }

          expect(api.createCrashReport).to.be.calledWith(body, 'auth-token-123')
        })
      })
    })
  })

  context('.safeErrorSerialize', () => {
    it('returns string as-is when error is already a string', () => {
      const stringError = 'Simple string error'

      expect(exception.safeErrorSerialize(stringError)).to.eq('Simple string error')
    })

    it('serializes plain objects properly', () => {
      const objectError = {
        additionalData: { type: 'studio:panel:opened' },
        message: 'Something went wrong',
        code: 'TELEMETRY_ERROR',
      }

      const result = exception.safeErrorSerialize(objectError)

      expect(result).to.eq(JSON.stringify(objectError))
    })

    it('handles circular reference objects safely without throwing', () => {
      // Create an object with circular reference
      const circularError = {
        message: 'Circular reference error',
        code: 'CIRCULAR_ERROR',
      }

      circularError.self = circularError // Create circular reference

      const result = exception.safeErrorSerialize(circularError)

      expect(result).to.eq(JSON.stringify({
        message: 'Circular reference error',
        code: 'CIRCULAR_ERROR',
        self: '[Circular]',
      }))
    })

    it('handles Error objects correctly', () => {
      const error = new Error('test error')

      error.code = 'TEST_CODE'
      error.errno = 123

      const result = exception.safeErrorSerialize(error)

      // serializeError should preserve Error properties
      const parsed = JSON.parse(result)

      expect(parsed.message).to.eq('test error')
      expect(parsed.name).to.eq('Error')
      expect(parsed.code).to.eq('TEST_CODE')
      expect(parsed.errno).to.eq(123)
    })

    it('handles null and undefined gracefully', () => {
      expect(exception.safeErrorSerialize(null)).to.eq('null')
      expect(exception.safeErrorSerialize(undefined)).to.eq('undefined')
    })

    it('handles primitive types', () => {
      expect(exception.safeErrorSerialize(42)).to.eq('42')
      expect(exception.safeErrorSerialize(true)).to.eq('true')
      expect(exception.safeErrorSerialize(false)).to.eq('false')
    })

    it('provides fallback for non-serializable objects', () => {
      // Create an object that might cause issues
      const problematicObject = {
        get value () {
          throw new Error('Cannot access value')
        },
      }

      const result = exception.safeErrorSerialize(problematicObject)

      expect(result).to.match(/^\[Non-serializable object:/)
    })

    it('handles deeply nested objects', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                message: 'Deep error',
                data: [1, 2, 3, { nested: true }],
              },
            },
          },
        },
      }

      const result = exception.safeErrorSerialize(deepObject)

      expect(result).to.eq(JSON.stringify(deepObject))
    })

    it('handles arrays with mixed content', () => {
      const arrayError = [
        'string',
        42,
        { message: 'object in array' },
        null,
        undefined,
      ]

      const result = exception.safeErrorSerialize(arrayError)

      expect(result).to.eq(JSON.stringify(arrayError))
    })
  })
})
