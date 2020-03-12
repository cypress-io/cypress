require('../spec_helper')

const chokidar = require('chokidar')
const browsers = require(`${root}lib/browsers`)
const Project = require(`${root}lib/project`)
const openProject = require(`${root}lib/open_project`)
const preprocessor = require(`${root}lib/plugins/preprocessor`)

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
    }

    sinon.stub(browsers, 'get').resolves()
    sinon.stub(browsers, 'open')
    sinon.stub(Project.prototype, 'open').resolves()
    sinon.stub(Project.prototype, 'reset').resolves()
    sinon.stub(Project.prototype, 'getSpecUrl').resolves()
    sinon.stub(Project.prototype, 'getConfig').resolves(this.config)
    sinon.stub(Project.prototype, 'getAutomation').returns(this.automation)
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
        expect(Project.prototype.reset).to.be.called
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
