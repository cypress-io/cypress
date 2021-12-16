require('../spec_helper')

const path = require('path')
const browsers = require(`../../lib/browsers`)
const ProjectBase = require(`../../lib/project-base`).ProjectBase
const { openProject } = require('../../lib/open_project')
const preprocessor = require(`../../lib/plugins/preprocessor`)
const runEvents = require(`../../lib/plugins/run_events`)
const Fixtures = require('@tooling/system-tests/lib/fixtures')

const todosPath = Fixtures.projectPath('todos')

describe('lib/open_project', () => {
  beforeEach(function () {
    this.automation = {
      reset: sinon.stub(),
      use: sinon.stub(),
    }

    this.config = {
      integrationFolder: '/user/foo/cypress/integration',
      testFiles: '**/*.*',
      ignoreTestFiles: '**/*.nope',
      projectRoot: '/project/root',
    }

    sinon.stub(browsers, 'get').resolves()
    sinon.stub(browsers, 'open')
    sinon.stub(ProjectBase.prototype, 'initializeConfig').resolves()
    sinon.stub(ProjectBase.prototype, 'open').resolves()
    sinon.stub(ProjectBase.prototype, 'reset').resolves()
    sinon.stub(ProjectBase.prototype, 'getConfig').returns(this.config)
    sinon.stub(ProjectBase.prototype, 'getAutomation').returns(this.automation)
    sinon.stub(preprocessor, 'removeFile')

    return openProject.create('/project/root', {}, {})
  })

  context('#launch', () => {
    beforeEach(async function () {
      await openProject.create('/root', {}, {})
      openProject.getProject().__setConfig({
        browserUrl: 'http://localhost:8888/__/',
        componentFolder: path.join(todosPath, 'component'),
        integrationFolder: path.join(todosPath, 'tests'),
        projectRoot: todosPath,
        specType: 'integration',
      })

      openProject.getProject().options = {}

      this.spec = {
        absolute: 'path/to/spec',
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
      beforeEach(function () {
        sinon.stub(runEvents, 'execute').resolves()
      })

      it('executes before:spec if in interactive mode', function () {
        this.config.experimentalInteractiveRunEvents = true
        this.config.isTextTerminal = false

        return openProject.launch(this.browser, this.spec).then(() => {
          expect(runEvents.execute).to.be.calledWith('before:spec', this.config, this.spec)
        })
      })

      it('does not execute before:spec if not in interactive mode', function () {
        this.config.experimentalInteractiveRunEvents = true
        this.config.isTextTerminal = true

        return openProject.launch(this.browser, this.spec).then(() => {
          expect(runEvents.execute).not.to.be.calledWith('before:spec')
        })
      })

      it('does not execute before:spec if experimental flag is not enabled', function () {
        this.config.experimentalInteractiveRunEvents = false
        this.config.isTextTerminal = false

        return openProject.launch(this.browser, this.spec).then(() => {
          expect(runEvents.execute).not.to.be.calledWith('before:spec')
        })
      })

      it('executes after:spec on browser close if in interactive mode', function () {
        this.config.experimentalInteractiveRunEvents = true
        this.config.isTextTerminal = false

        return openProject.launch(this.browser, this.spec)
        .then(() => {
          browsers.open.lastCall.args[1].onBrowserClose()
        })
        .delay(100) // needs a tick or two for the event to fire
        .then(() => {
          expect(runEvents.execute).to.be.calledWith('after:spec', this.config, this.spec)
        })
      })

      it('does not execute after:spec on browser close if not in interactive mode', function () {
        this.config.experimentalInteractiveRunEvents = true
        this.config.isTextTerminal = true

        return openProject.launch(this.browser, this.spec)
        .then(() => {
          browsers.open.lastCall.args[1].onBrowserClose()
        })
        .delay(10) // wait a few ticks to make sure it hasn't fired
        .then(() => {
          expect(runEvents.execute).not.to.be.calledWith('after:spec')
        })
      })

      it('does not execute after:spec on browser close if experimental flag is not enabled', function () {
        this.config.experimentalInteractiveRunEvents = false
        this.config.isTextTerminal = false

        return openProject.launch(this.browser, this.spec)
        .then(() => {
          browsers.open.lastCall.args[1].onBrowserClose()
        })
        .delay(10) // wait a few ticks to make sure it hasn't fired
        .then(() => {
          expect(runEvents.execute).not.to.be.calledWith('after:spec')
        })
      })

      it('does not execute after:spec on browser close if the project is no longer open', function () {
        this.config.experimentalInteractiveRunEvents = true
        this.config.isTextTerminal = false

        return openProject.launch(this.browser, this.spec)
        .then(() => {
          openProject.__reset()
          browsers.open.lastCall.args[1].onBrowserClose()
        })
        .delay(10) // wait a few ticks to make sure it hasn't fired
        .then(() => {
          expect(runEvents.execute).not.to.be.calledWith('after:spec')
        })
      })

      it('sends after:spec errors through onError option', function () {
        const err = new Error('thrown from after:spec handler')
        const onError = sinon.stub()

        this.config.experimentalInteractiveRunEvents = true
        this.config.isTextTerminal = false
        runEvents.execute.withArgs('after:spec').rejects(err)
        openProject.getProject().options.onError = onError

        return openProject.launch(this.browser, this.spec)
        .then(() => {
          browsers.open.lastCall.args[1].onBrowserClose()
        })
        .delay(100) // needs a tick or two for the event to fire
        .then(() => {
          expect(runEvents.execute).to.be.calledWith('after:spec')
          expect(onError).to.be.calledWith(err)
        })
      })
    })
  })
})
