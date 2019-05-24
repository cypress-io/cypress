require('../../spec_helper')
const root = global.root

const auth = require(`${root}../lib/gui/auth`)
const electron = require('electron')
const random = require(`${root}../lib/util/random`)
const windows = require(`${root}../lib/gui/windows`)

const BASE_URL = 'https://foo.invalid/login.html'
const RANDOM_STRING = 'a'.repeat(32)
const PORT = 9001
const LOGIN_URL = `https://foo.invalid/login.html?port=9001&state=${RANDOM_STRING}`

describe('lib/gui/auth', function () {
  context('._getOriginFromUrl', function () {
    it('given an https URL, returns the origin', function () {
      const origin = auth._getOriginFromUrl(LOGIN_URL)

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

    it('uses random and server.port to form a URL', function () {
      const url = auth._buildFullLoginUrl(BASE_URL, this.server)

      expect(url).to.eq(LOGIN_URL)
      expect(random.id).to.be.calledWith(32)
      expect(this.server.address).to.be.calledOnce
    })

    it('does not regenerate the state code', function () {
      auth._buildFullLoginUrl(BASE_URL, this.server)
      auth._buildFullLoginUrl(BASE_URL, this.server)

      expect(random.id).to.be.calledOnce
    })
  })

  context('._launchElectronAuth', function () {
    it('calls windows.open with DASHBOARD_LOGIN and the correct url', function () {
      sinon.stub(windows, 'open').resolves()

      return auth._launchElectronAuth(LOGIN_URL)
      .then(() => {
        expect(windows.open).to.be.calledWithMatch(null, {
          type: 'DASHBOARD_LOGIN',
          url: LOGIN_URL,
          focus: true,
        })
      })
    })
  })

  context('._launchNativeAuth', function () {
    it('is catchable if `shell` does not exist', function () {
      return auth._launchNativeAuth(LOGIN_URL)
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
        sinon.stub(electron.shell, 'openExternal').callsFake((_, _2, cb) => {
          cb()
        })

        return auth._launchNativeAuth(LOGIN_URL)
        .then(() => {
          expect(electron.shell.openExternal).to.be.calledWithMatch(LOGIN_URL, {}, sinon.match.func)
        })
      })

      it('returns a promise that is rejected when openExternal fails', function () {
        sinon.stub(electron.shell, 'openExternal').callsFake((_, _2, cb) => {
          cb(new Error('It broke!'))
        })

        return auth._launchNativeAuth(LOGIN_URL)
        .then(() => {
          throw new Error('This should not succeed')
        })
        .catch({ message: 'It broke!' }, () => {
          expect(electron.shell.openExternal).to.be.calledWithMatch(LOGIN_URL, {}, sinon.match.func)
        })
      })
    })
  })

})
