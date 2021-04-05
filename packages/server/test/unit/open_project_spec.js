require('../spec_helper')

const chokidar = require('chokidar')
const browsers = require(`${root}lib/browsers`)
const { ProjectE2E } = require(`${root}lib/project-e2e`)
const openProject = require(`${root}lib/open_project`)
const preprocessor = require(`${root}lib/plugins/preprocessor`)
const runEvents = require(`${root}lib/plugins/run_events`)

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
    sinon.stub(ProjectE2E.prototype, 'open').resolves()
    sinon.stub(ProjectE2E.prototype, 'reset').resolves()
    sinon.stub(ProjectE2E.prototype, 'getSpecUrl').resolves()
    sinon.stub(ProjectE2E.prototype, 'getConfig').resolves(this.config)
    sinon.stub(ProjectE2E.prototype, 'getAutomation').returns(this.automation)
    sinon.stub(preprocessor, 'removeFile')

    openProject.create('/project/root')
  })

  context('#launch', () => {
    beforeEach(function () {
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
        expect(ProjectE2E.prototype.reset).to.be.called
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
        this.config.isTextTerminal = false

        return openProject.launch(this.browser, this.spec).then(() => {
          expect(runEvents.execute).to.be.calledWith('before:spec', this.config, this.spec)
        })
      })

      it('does not execute before:spec if not in interactive mode', function () {
        this.config.isTextTerminal = true

        return openProject.launch(this.browser, this.spec).then(() => {
          expect(runEvents.execute).not.to.be.calledWith('before:spec')
        })
      })

      it('executes after:spec on browser close if in interactive mode', function () {
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

      it('does not execute after:spec on browser close if the project is no longer open', function () {
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

  context('#getSpecChanges', () => {
    beforeEach(function () {
      this.watcherStub = {
        on: sinon.stub(),
        close: sinon.stub(),
      }

      sinon.stub(chokidar, 'watch').returns(this.watcherStub)
    })

    it('watches spec files', function () {
      return openProject.getSpecChanges({}).then(() => {
        expect(chokidar.watch).to.be.calledWith(this.config.testFiles, {
          cwd: this.config.integrationFolder,
          ignored: this.config.ignoreTestFiles,
          ignoreInitial: true,
        })
      })
    })

    it('calls onChange callback when file is added', function () {
      const onChange = sinon.spy()

      this.watcherStub.on.withArgs('add').yields()

      return openProject.getSpecChanges({ onChange }).then(() => {
        expect(onChange).to.be.called
      })
    })

    it('calls onChange callback when file is removed', function () {
      const onChange = sinon.spy()

      this.watcherStub.on.withArgs('unlink').yields()

      return openProject.getSpecChanges({ onChange }).then(() => {
        expect(onChange).to.be.called
      })
    })

    it('only calls onChange once if there are multiple changes in a row', function () {
      const onChange = sinon.spy()

      this.watcherStub.on.withArgs('unlink').yields()
      this.watcherStub.on.withArgs('add').yields()
      this.watcherStub.on.withArgs('unlink').yields()
      this.watcherStub.on.withArgs('add').yields()

      return openProject.getSpecChanges({ onChange }).then(() => {
        expect(onChange).to.be.calledOnce
      })
    })

    it('destroys and creates specsWatcher as expected', function () {
      expect(openProject.specsWatcher).to.exist
      openProject.stopSpecsWatcher()
      expect(openProject.specsWatcher).to.be.null

      return openProject.getSpecChanges()
      .then(() => {
        expect(openProject.specsWatcher).to.exist
      })
    })
  })
})
