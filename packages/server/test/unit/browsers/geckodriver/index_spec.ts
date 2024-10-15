import Bluebird from 'bluebird'
import debug from 'debug'
import mockery from 'mockery'
import EventEmitter from 'events'
import { expect, sinon } from '../../../spec_helper'
import { GeckoDriver, type StartGeckoDriverArgs } from '../../../../lib/browsers/geckodriver'
import type Sinon from 'sinon'

describe('lib/browsers/geckodriver', () => {
  let geckoDriverMockProcess: any
  let geckoDriverMockStart: Sinon.SinonStub
  let waitPortPackageStub: Sinon.SinonStub
  let mockOpts: StartGeckoDriverArgs

  beforeEach(() => {
    geckoDriverMockProcess = new EventEmitter()

    geckoDriverMockStart = sinon.stub()
    waitPortPackageStub = sinon.stub()

    geckoDriverMockProcess.stdout = new EventEmitter()
    geckoDriverMockProcess.stderr = new EventEmitter()
    geckoDriverMockProcess.kill = sinon.stub().returns(true)

    mockOpts = {
      host: '127.0.0.1',
      port: 3000,
      marionetteHost: '127.0.0.1',
      marionettePort: 3001,
      webdriverBidiPort: 3002,
      profilePath: 'path/to/profile',
      binaryPath: 'path/to/binary',
    }

    mockery.enable()
    mockery.warnOnUnregistered(false)

    mockery.registerMock('wait-port', waitPortPackageStub)

    // we stub the dynamic require on the Class to make this easier to test
    // @ts-expect-error
    GeckoDriver.getGeckoDriverPackage = () => {
      return {
        start: geckoDriverMockStart,
      }
    }
  })

  afterEach(() => {
    mockery.deregisterMock('geckodriver')
    mockery.deregisterMock('wait-port')
    mockery.disable()
  })

  describe('GeckoDriver.create', () => {
    it('starts the geckodriver', async () => {
      geckoDriverMockStart.resolves(geckoDriverMockProcess)
      waitPortPackageStub.resolves()

      const geckoDriverInstanceWrapper = await GeckoDriver.create(mockOpts)

      expect(geckoDriverInstanceWrapper).to.equal(geckoDriverMockProcess)

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
        logNoTruncate: false,
        log: 'error',
        spawnOpts: {},
      }))

      expect(waitPortPackageStub).to.have.been.called.once
      expect(waitPortPackageStub).to.have.been.calledWith(sinon.match({
        port: 3000,
        timeout: 6000,
        output: 'silent',
      }))
    })

    it('allows overriding of default props when starting', async () => {
      geckoDriverMockStart.resolves(geckoDriverMockProcess)
      waitPortPackageStub.resolves()

      mockOpts.spawnOpts = {
        MOZ_FOO: 'BAR',
      }

      const geckoDriverInstanceWrapper = await GeckoDriver.create(mockOpts, 10000)

      expect(geckoDriverInstanceWrapper).to.equal(geckoDriverMockProcess)

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
        logNoTruncate: false,
        log: 'error',
        spawnOpts: {
          MOZ_FOO: 'BAR',
        },
      }))

      expect(waitPortPackageStub).to.have.been.called.once
      expect(waitPortPackageStub).to.have.been.calledWith(sinon.match({
        port: 3000,
        timeout: 11000,
        output: 'silent',
      }))
    })

    describe('debugging', () => {
      afterEach(() => {
        debug.disable()
      })

      it('sets additional arguments if "DEBUG=cypress-verbose:server:browsers:geckodriver" is set', async () => {
        debug.enable('cypress-verbose:server:browsers:geckodriver')
        geckoDriverMockStart.resolves(geckoDriverMockProcess)

        waitPortPackageStub.resolves()

        mockOpts.spawnOpts = {
          MOZ_FOO: 'BAR',
        }

        const geckoDriverInstanceWrapper = await GeckoDriver.create(mockOpts)

        expect(geckoDriverInstanceWrapper).to.equal(geckoDriverMockProcess)

        expect(geckoDriverMockStart).to.have.been.called.once
        expect(geckoDriverMockStart).to.have.been.calledWith(sinon.match({
          host: '127.0.0.1',
          port: 3000,
          marionetteHost: '127.0.0.1',
          marionettePort: 3001,
          websocketPort: 3002,
          profileRoot: 'path/to/profile',
          binary: 'path/to/binary',
          jsdebugger: true,
          logNoTruncate: true,
          log: 'debug',
          spawnOpts: {
            MOZ_FOO: 'BAR',
          },
        }))

        expect(waitPortPackageStub).to.have.been.called.once
        expect(waitPortPackageStub).to.have.been.calledWith(sinon.match({
          port: 3000,
          timeout: 6000,
          output: 'dots',
        }))
      })
    })

    describe('throws if', () => {
      it('geckodriver failed to start', async () => {
        geckoDriverMockStart.rejects(new Error('I FAILED TO START'))

        try {
          await GeckoDriver.create(mockOpts)
        } catch (err) {
          expect(err.isCypressErr).to.be.true
          expect(err.type).to.equal('FIREFOX_GECKODRIVER_FAILURE')

          // what the debug logs will show
          expect(err.details).to.contain('Error: I FAILED TO START')

          // what the user sees
          expect(err.messageMarkdown).to.equal('Cypress could not connect to Firefox.\n\nAn unexpected error was received from GeckoDriver: `geckodriver:start`\n\nTo avoid this error, ensure that there are no other instances of Firefox launched by Cypress running.')

          return
        }

        throw 'test did not enter catch as expected'
      })

      it('geckodriver failed to attach or took to long to register', async () => {
        geckoDriverMockStart.resolves(geckoDriverMockProcess)
        waitPortPackageStub.rejects(new Error('I DID NOT ATTACH OR TOOK TOO LONG!'))

        try {
          await GeckoDriver.create(mockOpts)
        } catch (err) {
          expect(err.isCypressErr).to.be.true
          expect(err.type).to.equal('FIREFOX_GECKODRIVER_FAILURE')

          // what the debug logs will show
          expect(err.details).to.contain('Error: I DID NOT ATTACH OR TOOK TOO LONG!')

          // what the user sees
          expect(err.messageMarkdown).to.equal('Cypress could not connect to Firefox.\n\nAn unexpected error was received from GeckoDriver: `geckodriver:start`\n\nTo avoid this error, ensure that there are no other instances of Firefox launched by Cypress running.')

          expect(geckoDriverMockProcess.kill).to.have.been.called.once

          return
        }

        throw 'test did not enter catch as expected'
      })

      it('geckodriver times out starting', async () => {
        geckoDriverMockStart.resolves(geckoDriverMockProcess)
        // return a promise that does not resolve so the timeout is reached
        waitPortPackageStub.resolves(new Bluebird(() => {}))

        try {
          // timeout after 0 seconds
          await GeckoDriver.create(mockOpts, 0)
        } catch (err) {
          expect(err.isCypressErr).to.be.true
          expect(err.type).to.equal('FIREFOX_GECKODRIVER_FAILURE')

          // what the debug logs will show
          expect(err.details).to.contain('TimeoutError: operation timed out')

          // what the user sees
          expect(err.messageMarkdown).to.equal('Cypress could not connect to Firefox.\n\nAn unexpected error was received from GeckoDriver: `geckodriver:start`\n\nTo avoid this error, ensure that there are no other instances of Firefox launched by Cypress running.')

          expect(geckoDriverMockProcess.kill).to.have.been.called.once

          return
        }

        throw 'test did not enter catch as expected'
      })
    })
  })
})
