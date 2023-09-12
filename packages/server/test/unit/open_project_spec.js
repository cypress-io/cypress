require('../spec_helper')

const Bluebird = require('bluebird')
const browsers = require(`../../lib/browsers`)
const ProjectBase = require(`../../lib/project-base`).ProjectBase
const { openProject } = require('../../lib/open_project')
const preprocessor = require(`../../lib/plugins/preprocessor`)
const runEvents = require(`../../lib/plugins/run_events`)
const Fixtures = require('@tooling/system-tests')
const delay = require('lodash/delay')

const todosPath = Fixtures.projectPath('todos')

describe('lib/open_project', () => {
  beforeEach(function () {
    this.automation = {
      reset: sinon.stub(),
      use: sinon.stub(),
    }

    this.config = {
      excludeSpecPattern: '**/*.nope',
      projectRoot: todosPath,
      proxyServer: 'http://cy-proxy-server',
    }

    this.onError = sinon.stub()
    sinon.stub(browsers, 'get').resolves()
    sinon.stub(browsers, 'open')
    sinon.stub(browsers, 'connectToNewSpec')
    sinon.stub(ProjectBase.prototype, 'initializeConfig').resolves({
      specPattern: 'cypress/integration/**/*',
    })

    sinon.stub(ProjectBase.prototype, 'open').resolves()
    sinon.stub(ProjectBase.prototype, 'reset').resolves()
    sinon.stub(ProjectBase.prototype, 'getConfig').returns(this.config)
    sinon.stub(ProjectBase.prototype, 'getAutomation').returns(this.automation)
    sinon.stub(preprocessor, 'removeFile')

    return Fixtures.scaffoldProject('todos').then(() => {
      return openProject.create(todosPath, { testingType: 'e2e' }, { onError: this.onError })
    })
  })

  context('#launch', () => {
    beforeEach(async function () {
      await openProject.create(todosPath, { testingType: 'e2e' }, { onError: this.onError })
      openProject.getProject().__setConfig({
        browserUrl: 'http://localhost:8888/__/',
        projectRoot: todosPath,
        specType: 'integration',
        e2e: {
          specPattern: 'cypress/integration/**/*',
        },
      })

      openProject.getProject().options = {
        onError: this.onError,
      }

      this.spec = {
        absolute: 'path/to/spec',
        relative: 'path/to/spec',
      }

      this.browser = { name: 'chrome' }
    })

    it('tells preprocessor to remove file on browser close', function () {
      return openProject.launch(this.browser, this.spec)
      .then(() => {
        browsers.open.lastCall.args[1].onBrowserClose()

        expect(preprocessor.removeFile).to.be.calledWith('path/to/spec')
      })
    })

    it('does not tell preprocessor to remove file if no spec', function () {
      return openProject.launch(this.browser, {})
      .then(() => {
        browsers.open.lastCall.args[1].onBrowserClose()

        expect(preprocessor.removeFile).not.to.be.called
      })
    })

    it('runs original onBrowserClose callback on browser close', function () {
      const onBrowserClose = sinon.stub()
      const options = { onBrowserClose }

      return openProject.launch(this.browser, this.spec, options)
      .then(() => {
        browsers.open.lastCall.args[1].onBrowserClose()

        expect(onBrowserClose).to.be.called
      })
    })

    it('calls project.reset on launch', function () {
      return openProject.launch(this.browser, this.spec)
      .then(() => {
        expect(ProjectBase.prototype.reset).to.be.called
      })
    })

    it('sets isHeaded + isHeadless if not already defined', function () {
      expect(this.browser.isHeaded).to.be.undefined
      expect(this.browser.isHeadless).to.be.undefined

      return openProject.launch(this.browser, this.spec)
      .then(() => {
        expect(this.browser.isHeaded).to.be.true

        expect(this.browser.isHeadless).to.be.false
      })
    })

    describe('spec events', function () {
      this.beforeEach(function () {
        sinon.stub(runEvents, 'execute').resolves()
      })

      it('executes after:spec on browser close if in interactive mode', function () {
        this.config.experimentalInteractiveRunEvents = true
        this.config.isTextTerminal = false
        const onBrowserClose = () => Bluebird.resolve()

        return openProject.launch(this.browser, this.spec, { onBrowserClose })
        .then(() => {
          return browsers.open.lastCall.args[1].onBrowserClose()
        })
        .then(() => {
          expect(runEvents.execute).to.be.calledWith('after:spec', this.spec)
        })
      })

      it('does not execute after:spec on browser close if not in interactive mode', function () {
        this.config.experimentalInteractiveRunEvents = true
        this.config.isTextTerminal = true
        const onBrowserClose = () => Bluebird.resolve()

        return openProject.launch(this.browser, this.spec, { onBrowserClose })
        .then(() => {
          return browsers.open.lastCall.args[1].onBrowserClose()
        })
        .then(() => {
          expect(runEvents.execute).not.to.be.calledWith('after:spec')
        })
      })

      it('does not execute after:spec on browser close if experimental flag is not enabled', function () {
        this.config.experimentalInteractiveRunEvents = false
        this.config.isTextTerminal = false
        const onBrowserClose = () => Bluebird.resolve()

        return openProject.launch(this.browser, this.spec, { onBrowserClose })
        .then(() => {
          return browsers.open.lastCall.args[1].onBrowserClose()
        })
        .then(() => {
          expect(runEvents.execute).not.to.be.calledWith('after:spec')
        })
      })

      it('does not execute after:spec on browser close if the project is no longer open', function () {
        this.config.experimentalInteractiveRunEvents = true
        this.config.isTextTerminal = false
        const onBrowserClose = () => Bluebird.resolve()

        return openProject.launch(this.browser, this.spec, { onBrowserClose })
        .then(() => {
          openProject.__reset()

          return browsers.open.lastCall.args[1].onBrowserClose()
        })
        .then(() => {
          expect(runEvents.execute).not.to.be.calledWith('after:spec')
        })
      })

      it('sends after:spec errors through onError option', function () {
        // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23448
        this.retries(15)

        const err = new Error('thrown from after:spec handler')

        this.config.experimentalInteractiveRunEvents = true
        this.config.isTextTerminal = false
        runEvents.execute.withArgs('after:spec').rejects(err)

        return openProject.launch(this.browser, this.spec, { onError: this.onError })
        .then(() => {
          return browsers.open.lastCall.args[1].onBrowserClose()
        })
        .then(() => {
          return new Bluebird((res) => {
            delay(() => {
              expect(runEvents.execute).to.be.calledWith('after:spec')
              expect(this.onError).to.be.calledWith(err)
              res()
            }, 100)
          })
        })
      })

      it('calls connectToNewSpec when shouldLaunchNewTab is set and the browser is not electron', async function () {
        await openProject.launch(this.browser, this.spec, { shouldLaunchNewTab: true })
        expect(browsers.connectToNewSpec.lastCall.args[0]).to.be.equal(this.browser)
      })

      it('calls open when shouldLaunchNewTab is set and the browser is electron', async function () {
        await openProject.launch({ name: 'electron' }, this.spec, { shouldLaunchNewTab: true })
        expect(browsers.open).to.have.been.calledOnce
      })
    })
  })

  context('#sendFocusBrowserMessage', () => {
    it('focuses browser if runner is connected', async () => {
      // Stubbing out relaunchBrowser function created during launch
      openProject.relaunchBrowser = sinon.stub()
      sinon.stub(ProjectBase.prototype, 'isRunnerSocketConnected').returns(true)
      sinon.stub(ProjectBase.prototype, 'sendFocusBrowserMessage').resolves()

      await openProject.sendFocusBrowserMessage()

      expect(ProjectBase.prototype.isRunnerSocketConnected).to.have.been.calledOnce
      expect(ProjectBase.prototype.sendFocusBrowserMessage).to.have.been.calledOnce
      expect(openProject.relaunchBrowser).not.to.have.been.called
    })

    it('relaunches browser if runner is not connected and relaunch exists', async () => {
      // Stubbing out relaunchBrowser function created during launch
      openProject.relaunchBrowser = sinon.stub()
      sinon.stub(ProjectBase.prototype, 'isRunnerSocketConnected').returns(false)
      sinon.stub(ProjectBase.prototype, 'sendFocusBrowserMessage').resolves()

      await openProject.sendFocusBrowserMessage()

      expect(ProjectBase.prototype.isRunnerSocketConnected).to.have.been.calledOnce
      expect(ProjectBase.prototype.sendFocusBrowserMessage).not.to.have.been.called
      expect(openProject.relaunchBrowser).to.have.been.calledOnce
    })

    it('does not throw if relaunch is not defined', async () => {
      // Stubbing out relaunchBrowser function created during launch
      openProject.relaunchBrowser = null
      sinon.stub(ProjectBase.prototype, 'isRunnerSocketConnected').returns(false)
      sinon.stub(ProjectBase.prototype, 'sendFocusBrowserMessage').resolves()

      await openProject.sendFocusBrowserMessage()

      expect(ProjectBase.prototype.isRunnerSocketConnected).to.have.been.calledOnce
      expect(ProjectBase.prototype.sendFocusBrowserMessage).not.to.have.been.called
    })
  })

  context('#connectProtocolToBrowser', () => {
    it('connects protocol to browser', async () => {
      sinon.stub(browsers, 'connectProtocolToBrowser').resolves()
      const options = sinon.stub()

      await openProject.connectProtocolToBrowser(options)

      expect(browsers.connectProtocolToBrowser).to.be.calledWith(options)
    })
  })
})
