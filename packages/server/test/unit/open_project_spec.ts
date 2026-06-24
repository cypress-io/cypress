import '../spec_helper'
import Bluebird from 'bluebird'
import browsers from '../../lib/browsers'
import { ProjectBase } from '../../lib/project-base'
import { openProject } from '../../lib/open_project'
import preprocessor from '../../lib/plugins/preprocessor'
import runEvents from '../../lib/plugins/run_events'
import Fixtures from '@tooling/system-tests'
import delay from 'lodash/delay'

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

  describe('#launch', () => {
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
        const onBrowserClose = () => Promise.resolve()

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
        const onBrowserClose = () => Promise.resolve()

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
        const onBrowserClose = () => Promise.resolve()

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
        const onBrowserClose = () => Promise.resolve()

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

      it('does not pass proxyServer to browser when CYPRESS_INTERNAL_DISABLE_PROXY=1', function () {
        process.env.CYPRESS_INTERNAL_DISABLE_PROXY = '1'
        delete this.config.proxyServer

        return openProject.launch(this.browser, this.spec)
        .then(() => {
          expect(browsers.open.lastCall.args[1].proxyServer).to.be.undefined
        })
        .finally(() => {
          delete process.env.CYPRESS_INTERNAL_DISABLE_PROXY
        })
      })
    })

    describe('after:screenshot specName', function () {
      beforeEach(function () {
        // _server is protected but accessible in JS; set it to a minimal mock so changeUrlToSpec doesn't throw
        openProject.getProject()._server = { socket: { changeToUrl: sinon.stub() }, setPreRequestTimeout: sinon.stub() }
      })

      it('falls back to spec.name when relativeToCommonRoot is absent', async function () {
        const specWithoutRelativeRoot = { name: 'basic.cy.ts', absolute: '/abs/basic.cy.ts', relative: 'cypress/e2e/basic.cy.ts' }

        await openProject.launch(this.browser, specWithoutRelativeRoot)

        const middlewareCall = this.automation.use.args.find((args) => args[0] && args[0].onBeforeRequest)

        expect(middlewareCall, 'onBeforeRequest middleware should have been registered').to.exist

        const { onBeforeRequest } = middlewareCall[0]
        const data = {}

        await onBeforeRequest('take:screenshot', data)
        expect(data.specName).to.equal('basic.cy.ts')
      })

      it('uses relativeToCommonRoot from the spec set by changeUrlToSpec, not from the stale launch closure', async function () {
        const emptySpec = { name: '', absolute: '', relative: '' }

        await openProject.launch(this.browser, emptySpec)

        const middlewareCall = this.automation.use.args.find((args) => args[0] && args[0].onBeforeRequest)

        expect(middlewareCall, 'onBeforeRequest middleware should have been registered').to.exist

        const { onBeforeRequest } = middlewareCall[0]

        // Before navigating to a spec, specName is empty
        const data = {}

        await onBeforeRequest('take:screenshot', data)
        expect(data.specName).to.equal('')

        // Simulate the user clicking a spec in the sidebar — changeUrlToSpec is called, not launch()
        const realSpec = { name: 'auth.cy.ts', relativeToCommonRoot: 'login/auth.cy.ts', absolute: '/abs/login/auth.cy.ts', relative: 'cypress/e2e/login/auth.cy.ts' }

        openProject.changeUrlToSpec(realSpec)

        // The middleware now reads relativeToCommonRoot from the updated projectBase.spec
        const data2 = {}

        await onBeforeRequest('take:screenshot', data2)
        expect(data2.specName).to.equal('login/auth.cy.ts')
      })
    })
  })

  context('#changeUrlToSpec', () => {
    beforeEach(async function () {
      await openProject.create(todosPath, { testingType: 'e2e' }, { onError: this.onError })
      openProject.getProject().__setConfig({
        browserUrl: 'http://localhost:8888/__/',
        projectRoot: todosPath,
      })

      openProject.getProject().options = { onError: this.onError }
      openProject.getProject().spec = { name: 'original-spec.cy.ts' }
      // _server is protected but accessible in JS; set it to a minimal mock so the getter doesn't throw
      openProject.getProject()._server = { socket: { changeToUrl: sinon.stub() }, setPreRequestTimeout: sinon.stub() }
    })

    it('updates projectBase.spec when given a spec with a name', function () {
      const realSpec = { name: 'auth.cy.ts', relativeToCommonRoot: 'login/auth.cy.ts', absolute: '/abs/login/auth.cy.ts', relative: 'cypress/e2e/login/auth.cy.ts' }

      openProject.changeUrlToSpec(realSpec)

      expect(openProject.getProject().spec).to.deep.include({ name: 'auth.cy.ts', relativeToCommonRoot: 'login/auth.cy.ts' })
    })

    it('does not update projectBase.spec when given an empty spec', function () {
      const emptySpec = { name: '', absolute: '', relative: '' }

      openProject.changeUrlToSpec(emptySpec)

      expect(openProject.getProject().spec.name).to.equal('original-spec.cy.ts')
    })
  })

  describe('#sendFocusBrowserMessage', () => {
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

  describe('#connectProtocolToBrowser', () => {
    it('connects protocol to browser', async () => {
      sinon.stub(browsers, 'connectProtocolToBrowser').resolves()
      const options = sinon.stub()

      await openProject.connectProtocolToBrowser(options)

      expect(browsers.connectProtocolToBrowser).to.be.calledWith(options)
    })
  })

  describe('#connectCyPromptToBrowser', () => {
    it('connects cy prompt to browser', async () => {
      sinon.stub(browsers, 'connectCyPromptToBrowser').resolves()
      const options = sinon.stub()

      await openProject.connectCyPromptToBrowser(options)
    })
  })
})
