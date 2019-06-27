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
const FULL_LOGIN_URL = `https://foo.invalid/login.html?port=${PORT}&state=${RANDOM_STRING}&machineId=abc123&version=${pkg.version}&platform=linux&arch=x64`

describe('lib/gui/auth', function () {
  beforeEach(() => {
    sinon.stub(os, 'platform').returns('linux')
    sinon.stub(os, 'arch').returns('x64')
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
        sinon.stub(electron.shell, 'openExternal').callsArg(2)

        return auth._launchNativeAuth(REDIRECT_URL)
        .then(() => {
          expect(electron.shell.openExternal).to.be.calledWithMatch(REDIRECT_URL, {}, sinon.match.func)
        })
      })

      it('is still fulfilled when openExternal fails, but sendWarning is called', function () {
        sinon.stub(electron.shell, 'openExternal').callsArgWith(2, new Error)
        const sendWarning = sinon.stub()

        return auth._launchNativeAuth(REDIRECT_URL, sendWarning)
        .then(() => {
          expect(electron.shell.openExternal).to.be.calledWithMatch(REDIRECT_URL, {}, sinon.match.func)
          expect(sendWarning).to.be.calledWithMatch('warning', 'AUTH_COULD_NOT_LAUNCH_BROWSER', REDIRECT_URL)
        })
      })
    })
  })

})
