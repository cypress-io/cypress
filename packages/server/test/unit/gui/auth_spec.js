require('../../spec_helper')

const auth = require(`../../../lib/gui/auth`)
const windows = require(`../../../lib/gui/windows`)
const user = require(`../../../lib/user`)

const electron = require('electron')
const machineId = require(`../../../lib/util/machine_id`)
const os = require('os')
const pkg = require('@packages/root')
const Promise = require('bluebird')
const random = require(`../../../lib/util/random`)

const BASE_URL = 'https://foo.invalid/login.html'
const RANDOM_STRING = 'a'.repeat(32)
const PORT = 9001
const REDIRECT_URL = `http://127.0.0.1:${PORT}/redirect-to-auth`
const FULL_LOGIN_URL = `https://foo.invalid/login.html?port=${PORT}&state=${RANDOM_STRING}&machineId=abc123&cypressVersion=${pkg.version}&platform=linux`
const FULL_LOGIN_URL_UTM = `https://foo.invalid/login.html?utm_source=Test%20Runner&utm_medium=GUI%20Tab&utm_campaign=Log%20In&port=${PORT}&state=${RANDOM_STRING}&machineId=abc123&cypressVersion=${pkg.version}&platform=linux`

describe('lib/gui/auth', function () {
  beforeEach(() => {
    sinon.stub(os, 'platform').returns('linux')
    sinon.stub(machineId, 'machineId').resolves('abc123')
  })

  afterEach(function () {
    auth._internal.stopServer()
  })

  context('_internal.getOriginFromUrl', function () {
    it('given an https URL, returns the origin', function () {
      const origin = auth._internal.getOriginFromUrl(FULL_LOGIN_URL)

      expect(origin).to.eq('https://foo.invalid')
    })

    it('given an http URL, returns the origin', function () {
      const origin = auth._internal.getOriginFromUrl('http://foo.invalid/login.html?abc=123&foo=bar')

      expect(origin).to.eq('http://foo.invalid')
    })
  })

  context('_internal.buildFullLoginUrl', function () {
    beforeEach(function () {
      sinon.stub(random, 'id').returns(RANDOM_STRING)
      this.server = {
        address: sinon.stub().returns({
          port: PORT,
        }),
      }
    })

    it('uses random and server.port to form a URL along with environment info', function () {
      return auth._internal.buildFullLoginUrl(BASE_URL, this.server)
      .then((url) => {
        expect(url).to.eq(FULL_LOGIN_URL)
        expect(random.id).to.be.calledWith(32)
        expect(this.server.address).to.be.calledOnce
      })
    })

    it('does not regenerate the state code', function () {
      return auth._internal.buildFullLoginUrl(BASE_URL, this.server)
      .then(() => {
        return auth._internal.buildFullLoginUrl(BASE_URL, this.server)
      })
      .then(() => {
        expect(random.id).to.be.calledOnce
      })
    })

    it('uses utm code to form a trackable URL', function () {
      return auth._internal.buildFullLoginUrl(BASE_URL, this.server, 'GUI Tab')
      .then((url) => {
        expect(url).to.eq(FULL_LOGIN_URL_UTM)
      })
    })
  })

  context('_internal.launchNativeAuth', function () {
    it('is catchable if `shell` does not exist', function () {
      return auth._internal.launchNativeAuth(REDIRECT_URL)
      .then(() => {
        throw new Error('This should not succeed')
      })
      .catchReturn(TypeError)
    })

    context('with `shell` available', function () {
      beforeEach(function () {
        this.oldOpenExternal = electron.shell.openExternal
        electron.shell.openExternal = () => {}
      })

      afterEach(function () {
        electron.shell.openExternal = this.oldOpenExternal
      })

      it('returns a promise that is fulfilled when openExternal succeeds', function () {
        sinon.stub(electron.shell, 'openExternal').resolves()
        const sendWarning = sinon.stub()

        return auth._internal.launchNativeAuth(REDIRECT_URL, sendWarning)
        .then(() => {
          expect(electron.shell.openExternal).to.be.calledWithMatch(REDIRECT_URL)
          expect(sendWarning).to.not.be.called
        })
      })

      it('is still fulfilled when openExternal fails, but sendWarning is called', function () {
        sinon.stub(electron.shell, 'openExternal').rejects()
        const sendWarning = sinon.stub()

        return auth._internal.launchNativeAuth(REDIRECT_URL, sendWarning)
        .then(() => {
          expect(electron.shell.openExternal).to.be.calledWithMatch(REDIRECT_URL)
          expect(sendWarning).to.be.calledWithMatch('warning', 'AUTH_COULD_NOT_LAUNCH_BROWSER', REDIRECT_URL)
        })
      })
    })
  })

  context('.start', () => {
    it('focuses main window upon successful auth', async () => {
      sinon.stub(user, 'getBaseLoginUrl').resolves('www.foo.bar')
      sinon.stub(Promise, 'fromCallback').resolves()
      sinon.stub(auth._internal, 'launchServer').resolves()
      sinon.stub(auth._internal, 'buildLoginRedirectUrl').resolves('www.redirect.url')
      sinon.stub(auth._internal, 'launchNativeAuth').resolves()
      sinon.stub(auth._internal, 'stopServer')
      sinon.stub(windows, 'focusMainWindow').callsFake(() => {})

      await auth.start(() => {}, 'code', () => {
        windows.focusMainWindow()
      })

      expect(auth._internal.stopServer).to.be.calledOnce
      expect(windows.focusMainWindow).to.be.calledOnce
    })

    it('focuses main window when auth fails', async () => {
      sinon.stub(user, 'getBaseLoginUrl').rejects(new Error('test error'))
      sinon.stub(auth._internal, 'stopServer')
      sinon.stub(windows, 'focusMainWindow').callsFake(() => {})

      try {
        await auth.start(() => {}, 'code', () => {
          windows.focusMainWindow()
        })
      } catch (e) {
        expect(e.message).to.eql('test error')
      }

      expect(auth._internal.stopServer).to.be.calledOnce
      expect(windows.focusMainWindow).to.be.calledOnce
    })
  })
})
