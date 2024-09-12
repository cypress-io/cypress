import mockery from 'mockery'
import nock from 'nock'
import EventEmitter from 'events'

import { expect, sinon } from '../../../spec_helper'

import { GeckoDriver, type StartGeckoDriverArgs } from '../../../../lib/browsers/geckodriver'
import type Sinon from 'sinon'

describe('lib/browsers/geckodriver', () => {
  let originalGeckoDriverClose: () => void
  let geckoDriverMockProcess: any
  let geckoDriverMockStart: Sinon.SinonStub
  let waitPortPackageStub: Sinon.SinonStub
  let mockSessionId: string
  let mockOpts: StartGeckoDriverArgs
  let nockContext: nock.Scope

  beforeEach(() => {
    geckoDriverMockProcess = new EventEmitter()

    geckoDriverMockStart = sinon.stub()
    waitPortPackageStub = sinon.stub()

    geckoDriverMockProcess.stdout = new EventEmitter()
    geckoDriverMockProcess.stderr = new EventEmitter()
    geckoDriverMockProcess.kill = sinon.stub().returns(true)

    geckoDriverMockStart = sinon.stub()
    waitPortPackageStub = sinon.stub()

    mockSessionId = `123456-abcdef`

    mockOpts = {
      host: '127.0.0.1',
      port: 3000,
      marionetteHost: '127.0.0.1',
      marionettePort: 3001,
      remotePort: 3002,
      browserName: 'firefox',
      extensions: ['path/to/ext'],
      profilePath: 'path/to/profile',
      binaryPath: 'path/to/binary',
    }

    nockContext = nock(`http://${mockOpts.host}:${mockOpts.port}`)

    mockery.enable()
    mockery.warnOnUnregistered(false)

    mockery.registerMock('wait-port', waitPortPackageStub)

    originalGeckoDriverClose = GeckoDriver.close

    // we stub the dynamic require on the Class to make this easier to test
    // @ts-expect-error
    GeckoDriver.getGeckoDriverPackage = () => {
      return {
        start: geckoDriverMockStart,
      }
    }
  })

  afterEach(() => {
    GeckoDriver.close = originalGeckoDriverClose

    GeckoDriver.close()
    mockery.deregisterMock('geckodriver')
    mockery.deregisterMock('wait-port')
    nock.cleanAll()
    mockery.disable()
  })

  describe('GeckoDriver.create', () => {
    it('starts the geckodriver, creates the webdriver session, and installs the extension add-on', async () => {
      geckoDriverMockStart.resolves(geckoDriverMockProcess)
      waitPortPackageStub.resolves()
      const newSessionScope = nockContext.post('/session', {
        capabilities: {
          alwaysMatch: {
            acceptInsecureCerts: true,
            'moz:firefoxOptions': {
              args: ['-headless'],
            },
          },
        },
      }).reply(200, {
        value: {
          capabilities: {},
          sessionId: mockSessionId,
        },
      })

      const installExtensionScope = nockContext.post(`/session/${mockSessionId}/moz/addon/install`, {
        path: mockOpts.extensions[0],
        temporary: true,
      }).reply(200)

      const geckoDriverInstanceWrapper = await GeckoDriver.create(mockOpts)

      expect(geckoDriverInstanceWrapper).to.be.instanceOf(GeckoDriver)

      expect(geckoDriverMockStart).to.have.been.called.once
      expect(geckoDriverMockStart).to.have.been.calledWith(sinon.match({
        host: '127.0.0.1',
        port: 3000,
        marionetteHost: '127.0.0.1',
        marionettePort: 3001,
        websocketPort: 3002,
        profileRoot: 'path/to/profile',
        binary: 'path/to/binary',
        jsdebugger: false,
        log: 'error',
      }))

      expect(waitPortPackageStub).to.have.been.called.once
      expect(waitPortPackageStub).to.have.been.calledWith(sinon.match({
        port: 3000,
        timeout: 5000,
      }))

      // make sure the new session call to the browser or WebDriver classic were made
      newSessionScope.done()

      // make sure the add extension call to the browser or WebDriver classic were made
      installExtensionScope.done()
    })

    describe('throws if', () => {
      it('geckodriver failed to start', async () => {
        geckoDriverMockStart.rejects(new Error('I FAILED TO START'))

        GeckoDriver.close = sinon.stub()
        try {
          await GeckoDriver.create(mockOpts)
        } catch (err) {
          expect(err.isCypressErr).to.be.true
          expect(err.type).to.equal('FIREFOX_GECKODRIVER_FAILURE')

          // what the debug logs will show
          expect(err.details).to.contain('Error: I FAILED TO START')

          // what the user sees
          expect(err.messageMarkdown).to.equal('Cypress could not connect to Firefox.\n\nAn unexpected error was received from GeckoDriver: `geckodriver:start`\n\nTo avoid this error, ensure that there are no other instances of Firefox launched by Cypress running.')

          expect(GeckoDriver.close).to.have.been.called.once

          return
        }

        throw 'test did not enter catch as expected'
      })

      it('geckodriver failed to attach or took to long to register', async () => {
        geckoDriverMockStart.resolves(geckoDriverMockProcess)
        waitPortPackageStub.rejects(new Error('I DID NOT ATTACH OR TOOK TOO LONG!'))

        GeckoDriver.close = sinon.stub()

        try {
          await GeckoDriver.create(mockOpts)
        } catch (err) {
          expect(err.isCypressErr).to.be.true
          expect(err.type).to.equal('FIREFOX_GECKODRIVER_FAILURE')

          // what the debug logs will show
          expect(err.details).to.contain('Error: I DID NOT ATTACH OR TOOK TOO LONG!')

          // what the user sees
          expect(err.messageMarkdown).to.equal('Cypress could not connect to Firefox.\n\nAn unexpected error was received from GeckoDriver: `geckodriver:start`\n\nTo avoid this error, ensure that there are no other instances of Firefox launched by Cypress running.')

          expect(GeckoDriver.close).to.have.been.called.once

          return
        }

        throw 'test did not enter catch as expected'
      })

      it('the WebDriver session could not be instantiated', async () => {
        geckoDriverMockStart.resolves(geckoDriverMockProcess)
        waitPortPackageStub.resolves()

        const newSessionScope = nockContext.post('/session', {
          capabilities: {
            alwaysMatch: {
              acceptInsecureCerts: true,
              'moz:firefoxOptions': {
                args: ['-headless'],
              },
            },
          },
        }).reply(500)

        GeckoDriver.close = sinon.stub()

        try {
          await GeckoDriver.create(mockOpts)
        } catch (err) {
          expect(err.isCypressErr).to.be.true
          expect(err.type).to.equal('FIREFOX_GECKODRIVER_FAILURE')

          // what the debug logs will show
          expect(err.details).to.contain('Error: 500: Internal Server Error')

          // what the user sees
          expect(err.messageMarkdown).to.equal('Cypress could not connect to Firefox.\n\nAn unexpected error was received from GeckoDriver: `webdriver:session:create`\n\nTo avoid this error, ensure that there are no other instances of Firefox launched by Cypress running.')

          // make sure the new session call to the browser or WebDriver classic were made
          newSessionScope.done()
          expect(GeckoDriver.close).to.have.been.called.once

          return
        }

        throw 'test did not enter catch as expected'
      })

      it('the extension could not be added', async () => {
        geckoDriverMockStart.resolves(geckoDriverMockProcess)
        waitPortPackageStub.resolves()

        const newSessionScope = nockContext.post('/session', {
          capabilities: {
            alwaysMatch: {
              acceptInsecureCerts: true,
              'moz:firefoxOptions': {
                args: ['-headless'],
              },
            },
          },
        }).reply(200, {
          value: {
            capabilities: {},
            sessionId: mockSessionId,
          },
        })

        const installExtensionScope = nockContext.post(`/session/${mockSessionId}/moz/addon/install`, {
          path: mockOpts.extensions[0],
          temporary: true,
        }).reply(500, {})

        GeckoDriver.close = sinon.stub()

        try {
          await GeckoDriver.create(mockOpts)
        } catch (err) {
          expect(err.isCypressErr).to.be.true
          expect(err.type).to.equal('FIREFOX_GECKODRIVER_FAILURE')

          // what the debug logs will show
          expect(err.details).to.contain('Error: Unable to install extension!')

          // what the user sees
          expect(err.messageMarkdown).to.equal('Cypress could not connect to Firefox.\n\nAn unexpected error was received from GeckoDriver: `webdriver:addon:install`\n\nTo avoid this error, ensure that there are no other instances of Firefox launched by Cypress running.')

          // make sure the new session call to the browser or WebDriver classic were made
          newSessionScope.done()

          // make sure the add extension call to the browser or WebDriver classic were made
          installExtensionScope.done()

          expect(GeckoDriver.close).to.have.been.called.once

          return
        }

        throw 'test did not enter catch as expected'
      })
    })
  })

  describe('GeckoDriver.close', () => {
    it('kills the current instance if one exists', async () => {
      geckoDriverMockStart.resolves(geckoDriverMockProcess)
      waitPortPackageStub.resolves()

      nockContext.post('/session', {
        capabilities: {
          alwaysMatch: {
            acceptInsecureCerts: true,
            'moz:firefoxOptions': {
              args: ['-headless'],
            },
          },
        },
      }).reply(200, {
        value: {
          capabilities: {},
          sessionId: mockSessionId,
        },
      })

      nockContext.post(`/session/${mockSessionId}/moz/addon/install`, {
        path: mockOpts.extensions[0],
        temporary: true,
      }).reply(200)

      await GeckoDriver.create(mockOpts)

      expect(geckoDriverMockProcess.kill).not.to.have.been.called

      await GeckoDriver.close()

      expect(geckoDriverMockProcess.kill).to.have.been.called.once

      await GeckoDriver.close()

      // not called again
      expect(geckoDriverMockProcess.kill).to.have.been.called.once
    })

    it('otherwise, no-ops', async () => {
      await GeckoDriver.close()

      expect(geckoDriverMockProcess.kill).not.to.have.been.called
    })
  })

  describe('WebDriver Classic methods', () => {
    let geckoDriverInstance: GeckoDriver

    beforeEach(async () => {
      geckoDriverMockStart.resolves(geckoDriverMockProcess)
      waitPortPackageStub.resolves()

      nockContext.post('/session', {
        capabilities: {
          alwaysMatch: {
            acceptInsecureCerts: true,
            'moz:firefoxOptions': {
              args: ['-headless'],
            },
          },
        },
      }).reply(200, {
        value: {
          capabilities: {},
          sessionId: mockSessionId,
        },
      })

      nockContext.post(`/session/${mockSessionId}/moz/addon/install`, {
        path: mockOpts.extensions[0],
        temporary: true,
      }).reply(200)

      geckoDriverInstance = await GeckoDriver.create(mockOpts)
    })

    describe('getWindowHandlesWebDriverClassic', () => {
      it('returns the page contexts when the requests succeeds', async () => {
        const expectedContexts = ['mock-context-id-1']

        nockContext.get(`/session/${mockSessionId}/window/handles`).reply(200, {
          value: expectedContexts,
        })

        const contexts = await geckoDriverInstance.getWindowHandlesWebDriverClassic()

        expect(contexts).to.deep.equal(expectedContexts)
      })

      it('throws an error if the request fails', async () => {
        nockContext.get(`/session/${mockSessionId}/window/handles`).reply(500)

        try {
          await geckoDriverInstance.getWindowHandlesWebDriverClassic()
        } catch (err) {
          expect(err.message).to.equal('500: Internal Server Error')

          return
        }

        throw 'test did not enter catch as expected'
      })
    })

    describe('switchToWindowWebDriverClassic', () => {
      // what happens when you pass a bad context?
      it('returns the page contexts when the requests succeeds', async () => {
        nockContext.post(`/session/${mockSessionId}/window`, {
          handle: 'mock-context-id',
        }).reply(200, {
          value: null,
        })

        const payload = await geckoDriverInstance.switchToWindowWebDriverClassic('mock-context-id')

        expect(payload).to.equal(null)
      })

      it('throws an error if the request fails', async () => {
        nockContext.post(`/session/${mockSessionId}/window`, {
          handle: 'mock-context-id',
        }).reply(500)

        try {
          await geckoDriverInstance.switchToWindowWebDriverClassic('mock-context-id')
        } catch (err) {
          expect(err.message).to.equal('500: Internal Server Error')

          return
        }

        throw 'test did not enter catch as expected'
      })
    })

    describe('navigateWebdriverClassic', () => {
      let mockNavigationUrl = 'http://localhost:8080'

      it('returns the page contexts when the requests succeeds', async () => {
        nockContext.post(`/session/${mockSessionId}/url`, {
          url: mockNavigationUrl,
        }).reply(200, {
          value: null,
        })

        const payload = await geckoDriverInstance.navigateWebdriverClassic(mockNavigationUrl)

        expect(payload).to.equal(null)
      })

      it('throws an error if the request fails', async () => {
        nockContext.post(`/session/${mockSessionId}/url`, {
          url: mockNavigationUrl,
        }).reply(500)

        try {
          await geckoDriverInstance.navigateWebdriverClassic(mockNavigationUrl)
        } catch (err) {
          expect(err.message).to.equal('500: Internal Server Error')

          return
        }

        throw 'test did not enter catch as expected'
      })
    })
  })
})
