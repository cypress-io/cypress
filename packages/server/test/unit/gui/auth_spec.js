require('../../spec_helper')
const root = global.root

const auth = require(`${root}../lib/gui/auth`)
const electron = require('electron')
const random = require(`${root}../lib/util/random`)

const BASE_URL = 'https://foo.invalid/login.html'
const RANDOM_STRING = 'a'.repeat(32)
const PORT = 9001
const REDIRECT_URL = `http://127.0.0.1:${PORT}/redirect-to-auth`
const FULL_LOGIN_URL = `https://foo.invalid/login.html?port=${PORT}&state=${RANDOM_STRING}`

describe('lib/gui/auth', function () {
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

    it('uses random and server.port to form a URL', function () {
      const url = auth._buildFullLoginUrl(BASE_URL, this.server)

      expect(url).to.eq(FULL_LOGIN_URL)
      expect(random.id).to.be.calledWith(32)
      expect(this.server.address).to.be.calledOnce
    })

    it('does not regenerate the state code', function () {
      auth._buildFullLoginUrl(BASE_URL, this.server)
      auth._buildFullLoginUrl(BASE_URL, this.server)

      expect(random.id).to.be.calledOnce
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

      it('is still fulfilled when openExternal fails, but onWarning is called', function () {
        sinon.stub(electron.shell, 'openExternal').callsArgWith(2, new Error)
        const onWarning = sinon.stub()

        return auth._launchNativeAuth(REDIRECT_URL, onWarning)
        .then(() => {
          expect(electron.shell.openExternal).to.be.calledWithMatch(REDIRECT_URL, {}, sinon.match.func)
          expect(onWarning).to.be.calledWithMatch({
            message: `Cypress was unable to open your installed browser. To continue logging in to the dashboard, please open this URL in your web browser: ${REDIRECT_URL}`,
          })
        })
      })
    })
  })

})
