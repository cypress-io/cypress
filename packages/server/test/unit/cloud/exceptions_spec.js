require('../../spec_helper')

delete global.fs

const api = require('../../../lib/cloud/api').default
const user = require('../../../lib/cloud/user')
const exception = require('../../../lib/cloud/exception')
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
})
