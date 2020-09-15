require('../../spec_helper')
const root = global.root

const auth = require(`${root}../lib/gui/auth`)
const electron = require('electron')
const machineId = require(`${root}../lib/util/machine_id`)
const os = require('os')
const pkg = require('@packages/root')
const random = require(`${root}../lib/util/random`)

const BASE_URL = 'https://foo.invalid/login.html'
const RANDOM_STRING = 'a'.repeat(32)
const PORT = 9001
const REDIRECT_URL = `http://127.0.0.1:${PORT}/redirect-to-auth`
const FULL_LOGIN_URL = `https://foo.invalid/login.html?port=${PORT}&state=${RANDOM_STRING}&machineId=abc123&cypressVersion=${pkg.version}&platform=linux`
const FULL_LOGIN_URL_UTM = `https://foo.invalid/login.html?utm_source=Test%20Runner&utm_medium=Login%20Button&utm_campaign=TR-Dashboard&utm_content=Login%20Button&port=${PORT}&state=${RANDOM_STRING}&machineId=abc123&cypressVersion=${pkg.version}&platform=linux`

describe('lib/gui/auth', function () {
  beforeEach(() => {
    sinon.stub(os, 'platform').returns('linux')
    sinon.stub(machineId, 'machineId').resolves('abc123')
  })

  afterEach(function () {
    auth._stopServer()
  })

  context('._getOriginFromUrl', function () {
    it('given an https URL, returns the origin', function () {
      const origin = auth._getOriginFromUrl(FULL_LOGIN_URL)

      expect(origin).to.eq('https://foo.invalid')
    })

    it('given an http URL, returns the origin', function () {
      const origin = auth._getOriginFromUrl('http://foo.invalid/login.html?abc=123&foo=bar')

      expect(origin).to.eq('http://foo.invalid')
    })
  })

  context('._buildFullLoginUrl', function () {
    beforeEach(function () {
      sinon.stub(random, 'id').returns(RANDOM_STRING)
      this.server = {
        address: sinon.stub().returns({
          port: PORT,
        }),
      }
    })

    it('uses random and server.port to form a URL along with environment info', function () {
      return auth._buildFullLoginUrl(BASE_URL, this.server)
      .then((url) => {
        expect(url).to.eq(FULL_LOGIN_URL)
        expect(random.id).to.be.calledWith(32)
        expect(this.server.address).to.be.calledOnce
      })
    })

    it('does not regenerate the state code', function () {
      return auth._buildFullLoginUrl(BASE_URL, this.server)
      .then(() => {
        return auth._buildFullLoginUrl(BASE_URL, this.server)
      })
      .then(() => {
        expect(random.id).to.be.calledOnce
      })
    })

    it('uses utm code to form a trackable URL', function () {
      return auth._buildFullLoginUrl(BASE_URL, this.server, 'Login Button')
      .then((url) => {
        expect(url).to.eq(FULL_LOGIN_URL_UTM)
      })
    })
  })

  context('._launchNativeAuth', function () {
    it('is catchable if `shell` does not exist', function () {
      return auth._launchNativeAuth(REDIRECT_URL)
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

        return auth._launchNativeAuth(REDIRECT_URL, sendWarning)
        .then(() => {
          expect(electron.shell.openExternal).to.be.calledWithMatch(REDIRECT_URL)
          expect(sendWarning).to.not.be.called
        })
      })

      it('is still fulfilled when openExternal fails, but sendWarning is called', function () {
        sinon.stub(electron.shell, 'openExternal').rejects()
        const sendWarning = sinon.stub()

        return auth._launchNativeAuth(REDIRECT_URL, sendWarning)
        .then(() => {
          expect(electron.shell.openExternal).to.be.calledWithMatch(REDIRECT_URL)
          expect(sendWarning).to.be.calledWithMatch('warning', 'AUTH_COULD_NOT_LAUNCH_BROWSER', REDIRECT_URL)
        })
      })
    })
  })
})
