require('../spec_helper')

const browsers = require(`../../lib/browsers`)
const ProjectBase = require(`../../lib/project-base`).ProjectBase
const { openProject } = require('../../lib/open_project')
const preprocessor = require(`../../lib/plugins/preprocessor`)
const Fixtures = require('@tooling/system-tests')

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
      it('calls connectToNewSpec when shouldLaunchNewTab is set', async function () {
        await openProject.launch(this.browser, this.spec, { shouldLaunchNewTab: true })
        expect(browsers.connectToNewSpec.lastCall.args[0]).to.be.equal(this.browser)
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
})
