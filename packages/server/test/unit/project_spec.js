require('../spec_helper')

const mockedEnv = require('mocked-env')
const path = require('path')
const chokidar = require('chokidar')
const pkg = require('@packages/root')
const Fixtures = require('@tooling/system-tests/lib/fixtures')
const { sinon } = require('../spec_helper')
const user = require(`../../lib/user`)
const config = require(`../../lib/config`)
const scaffold = require(`../../lib/scaffold`)
const { ServerE2E } = require(`../../lib/server-e2e`)
const { ProjectBase } = require(`../../lib/project-base`)
const ProjectUtils = require(`../../lib/project_utils`)
const { Automation } = require(`../../lib/automation`)
const savedState = require(`../../lib/saved_state`)
const plugins = require(`../../lib/plugins`)
const runEvents = require(`../../lib/plugins/run_events`)
const system = require(`../../lib/util/system`)
const { fs } = require(`../../lib/util/fs`)
const settings = require(`../../lib/util/settings`)
const Watchers = require(`../../lib/watchers`)
const { SocketE2E } = require(`../../lib/socket-e2e`)
const { getCtx } = require(`../../lib/makeDataContext`)

let ctx

describe('lib/project-base', () => {
  beforeEach(function () {
    ctx = getCtx()
    Fixtures.scaffold()

    this.todosPath = Fixtures.projectPath('todos')
    this.idsPath = Fixtures.projectPath('ids')
    this.pristinePath = Fixtures.projectPath('pristine-with-config-file')

    sinon.stub(scaffold, 'isNewProject').resolves(false)
    sinon.stub(chokidar, 'watch').returns({
      on: () => {},
      close: () => {},
    })

    sinon.stub(runEvents, 'execute').resolves()

    ctx.actions.project.setActiveProjectForTestSetup(this.todosPath)

    return settings.read(this.todosPath)
    .then((obj = {}) => {
      ({ projectId: this.projectId } = obj)

      return config.set({ projectName: 'project', projectRoot: '/foo/bar' })
      .then((config1) => {
        this.config = config1
        this.project = new ProjectBase({ projectRoot: this.todosPath, testingType: 'e2e' })
        this.project._server = { close () {} }
        this.project._cfg = config1
      })
    })
  })

  afterEach(function () {
    Fixtures.remove()

    if (this.project) {
      this.project.close()
    }
  })

  it('requires a projectRoot', function () {
    const fn = () => new ProjectBase({})

    expect(fn).to.throw('Instantiating lib/project requires a projectRoot!')
  })

  it('always resolves the projectRoot to be absolute', function () {
    const p = new ProjectBase({ projectRoot: '../foo/bar', testingType: 'e2e' })

    expect(p.projectRoot).not.to.eq('../foo/bar')
    expect(p.projectRoot).to.eq(path.resolve('../foo/bar'))
  })

  it('sets CT specific defaults and calls CT function', async function () {
    sinon.stub(ServerE2E.prototype, 'open').resolves([])
    sinon.stub(ProjectBase.prototype, 'startCtDevServer').resolves({ port: 9999 })

    const projectCt = new ProjectBase({ projectRoot: this.pristinePath, testingType: 'component' })

    await projectCt.initializeConfig()

    return projectCt.open({}).then(() => {
      expect(projectCt._cfg.viewportHeight).to.eq(500)
      expect(projectCt._cfg.viewportWidth).to.eq(500)
      expect(projectCt._cfg.baseUrl).to.eq('http://localhost:9999')
      expect(projectCt.startCtDevServer).to.have.beenCalled
    })
  })

  context('#saveState', function () {
    beforeEach(function () {
      const integrationFolder = 'the/save/state/test'

      sinon.stub(config, 'get').withArgs(this.todosPath).resolves({ integrationFolder })
      this.project.cfg = { integrationFolder }

      return savedState.create(this.project.projectRoot)
      .then((state) => state.remove())
    })

    afterEach(function () {
      return savedState.create(this.project.projectRoot)
      .then((state) => state.remove())
    })

    it('saves state without modification', function () {
      return this.project.saveState()
      .then((state) => expect(state).to.deep.eq({}))
    })

    it('adds property', function () {
      return this.project.saveState()
      .then(() => this.project.saveState({ appWidth: 42 }))
      .then((state) => expect(state).to.deep.eq({ appWidth: 42 }))
    })

    it('adds second property', function () {
      return this.project.saveState()
      .then(() => this.project.saveState({ appWidth: 42 }))
      .then(() => this.project.saveState({ appHeight: true }))
      .then((state) => expect(state).to.deep.eq({ appWidth: 42, appHeight: true }))
    })

    it('modifes property', function () {
      return this.project.saveState()
      .then(() => this.project.saveState({ appWidth: 42 }))
      .then(() => this.project.saveState({ appWidth: 'modified' }))
      .then((state) => expect(state).to.deep.eq({ appWidth: 'modified' }))
    })
  })

  context('#initializeConfig', () => {
    const integrationFolder = 'foo/bar/baz'

    beforeEach(function () {
      sinon.stub(config, 'get').withArgs(this.todosPath, { foo: 'bar', configFile: 'cypress.config.js' })
      .resolves({ baz: 'quux', integrationFolder, browsers: [] })
    })

    it('calls config.get with projectRoot + options + saved state', function () {
      this.project.__setOptions({ foo: 'bar' })

      return savedState.create(this.todosPath)
      .then(async (state) => {
        sinon.stub(state, 'get').resolves({ reporterWidth: 225 })

        await this.project.initializeConfig()
        expect(this.project.getConfig()).to.deep.eq({
          integrationFolder,
          browsers: [],
          isNewProject: false,
          baz: 'quux',
          state: {
            reporterWidth: 225,
          },
        })
      })
    })

    it('resolves if cfg is already set', async function () {
      this.project._cfg = {
        integrationFolder,
        foo: 'bar',
      }

      expect(this.project.getConfig()).to.deep.eq({
        integrationFolder,
        foo: 'bar',
      })
    })

    it('does not set cfg.isNewProject when cfg.isTextTerminal', function () {
      const cfg = { isTextTerminal: true, browsers: [] }

      config.get.resolves(cfg)

      sinon.stub(this.project, '_setSavedState').resolves(cfg)

      return this.project.initializeConfig()
      .then((cfg) => {
        expect(cfg).not.to.have.property('isNewProject')
      })
    })

    it('attaches warning to non-chrome browsers when chromeWebSecurity:false', async function () {
      const cfg = Object.assign({}, {
        integrationFolder,
        browsers: [{ family: 'chromium', name: 'Canary' }, { family: 'some-other-family', name: 'some-other-name' }],
        chromeWebSecurity: false,
      })

      config.get.restore()
      sinon.stub(config, 'get').returns(cfg)

      await this.project.initializeConfig()
      .then(() => {
        const cfg = this.project.getConfig()

        expect(cfg.chromeWebSecurity).eq(false)
        expect(cfg.browsers).deep.eq([
          {
            family: 'chromium',
            name: 'Canary',
          },
          {
            family: 'some-other-family',
            name: 'some-other-name',
            warning: `\
Your project has set the configuration option: \`chromeWebSecurity: false\`

This option will not have an effect in Some-other-name. Tests that rely on web security being disabled will not run as expected.\
`,
          },
        ])

        expect(cfg).ok
      })
    })

    // https://github.com/cypress-io/cypress/issues/17614
    it('only attaches warning to non-chrome browsers when chromeWebSecurity:true', async function () {
      config.get.restore()
      sinon.stub(config, 'get').returns({
        integrationFolder,
        browsers: [{ family: 'chromium', name: 'Canary' }, { family: 'some-other-family', name: 'some-other-name' }],
        chromeWebSecurity: true,
      })

      await this.project.initializeConfig()
      .then(() => {
        const cfg = this.project.getConfig()

        expect(cfg.chromeWebSecurity).eq(true)
        expect(cfg.browsers).deep.eq([
          {
            family: 'chromium',
            name: 'Canary',
          },
          {
            family: 'some-other-family',
            name: 'some-other-name',
          },
        ])
      })
    })
  })

  context('#initializeConfig', function () {
  })

  context('#open', () => {
    beforeEach(function () {
      sinon.stub(this.project, 'watchSettings')
      sinon.stub(this.project, 'startWebsockets')
      this.checkSupportFileStub = sinon.stub(ProjectUtils, 'checkSupportFile').resolves()
      sinon.stub(this.project, 'scaffold').resolves()
      sinon.stub(this.project, 'getConfig').returns(this.config)
      sinon.stub(ServerE2E.prototype, 'open').resolves([])
      sinon.stub(ServerE2E.prototype, 'reset')
      sinon.stub(config, 'updateWithPluginValues').returns(this.config)
      sinon.stub(scaffold, 'plugins').resolves()
      sinon.stub(plugins, 'init').resolves()
    })

    it('calls #watchSettings with options + config', function () {
      return this.project.open().then(() => {
        expect(this.project.watchSettings).to.be.calledWith({
          configFile: undefined,
          onSettingsChanged: false,
          projectRoot: this.todosPath,
        })
      })
    })

    it('calls #startWebsockets with options + config', function () {
      const onFocusTests = sinon.stub()

      this.project.__setOptions({
        onFocusTests,
      })

      return this.project.open().then(() => {
        expect(this.project.startWebsockets).to.be.calledWith({
          onReloadBrowser: undefined,
          onFocusTests,
          onSpecChanged: undefined,
        }, {
          socketIoCookie: '__socket.io',
          namespace: '__cypress',
          screenshotsFolder: '/foo/bar/cypress/screenshots',
          report: undefined,
          reporter: 'spec',
          reporterOptions: null,
          projectRoot: this.todosPath,
        })
      })
    })

    it('calls #scaffold with server config promise', function () {
      return this.project.open().then(() => {
        expect(this.project.scaffold).to.be.calledWith(this.config)
      })
    })

    it('calls checkSupportFile with server config when scaffolding is finished', function () {
      return this.project.open().then(() => {
        expect(this.checkSupportFileStub).to.be.calledWith({
          configFile: 'cypress.config.js',
          supportFile: '/foo/bar/cypress/support/index.js',
        })
      })
    })

    it('initializes the plugins', function () {
      return this.project.open().then(() => {
        expect(plugins.init).to.be.called
      })
    })

    it('calls support.plugins with pluginsFile directory', function () {
      return this.project.open().then(() => {
        expect(scaffold.plugins).to.be.calledWith(path.dirname(this.config.pluginsFile))
      })
    })

    it('calls options.onError with plugins error when there is a plugins error', function () {
      const onError = sinon.spy()
      const err = {
        name: 'plugin error name',
        message: 'plugin error message',
      }

      this.project.__setOptions({ onError })

      return this.project.open().then(() => {
        const pluginsOnError = plugins.init.lastCall.args[1].onError

        expect(pluginsOnError).to.be.a('function')
        pluginsOnError(err)

        expect(onError).to.be.calledWith(err)
      })
    })

    // TODO: skip this for now
    it.skip('watches cypress.config.js', function () {
      return this.server.open().bind(this).then(() => {
        expect(Watchers.prototype.watch).to.be.calledWith('/Users/brian/app/cypress.config.js')
      })
    })

    // TODO: skip this for now
    it.skip('passes watchers to Socket.startListening', function () {
      const options = {}

      return this.server.open(options).then(() => {
        const { startListening } = SocketE2E.prototype

        expect(startListening.getCall(0).args[0]).to.be.instanceof(Watchers)

        expect(startListening.getCall(0).args[1]).to.eq(options)
      })
    })

    it('executes before:run if in interactive mode', function () {
      const sysInfo = {
        osName: 'darwin',
        osVersion: '1.2.3',
      }

      sinon.stub(system, 'info').resolves(sysInfo)
      this.config.experimentalInteractiveRunEvents = true
      this.config.isTextTerminal = false

      return this.project.open()
      .then(() => {
        expect(runEvents.execute).to.be.calledWith('before:run', this.config, {
          config: this.config,
          cypressVersion: pkg.version,
          system: sysInfo,
        })
      })
    })

    it('does not get system info or execute before:run if not in interactive mode', function () {
      sinon.stub(system, 'info')
      this.config.experimentalInteractiveRunEvents = true
      this.config.isTextTerminal = true

      return this.project.open()
      .then(() => {
        expect(system.info).not.to.be.called
        expect(runEvents.execute).not.to.be.calledWith('before:run')
      })
    })

    it('does not call startSpecWatcher if not in interactive mode', function () {
      const startSpecWatcherStub = sinon.stub()

      sinon.stub(ProjectBase.prototype, 'initializeSpecStore').resolves({
        startSpecWatcher: startSpecWatcherStub,
      })

      this.config.isTextTerminal = true

      return this.project.open()
      .then(() => {
        expect(startSpecWatcherStub).not.to.be.called
      })
    })

    it('calls startSpecWatcher if in interactive mode', function () {
      const startSpecWatcherStub = sinon.stub()

      sinon.stub(ProjectBase.prototype, 'initializeSpecStore').resolves({
        startSpecWatcher: startSpecWatcherStub,
      })

      this.config.isTextTerminal = false

      return this.project.open()
      .then(() => {
        expect(startSpecWatcherStub).to.be.called
      })
    })

    it('does not get system info or execute before:run if experimental flag is not enabled', function () {
      sinon.stub(system, 'info')
      this.config.experimentalInteractiveRunEvents = false
      this.config.isTextTerminal = false

      return this.project.open()
      .then(() => {
        expect(system.info).not.to.be.called
        expect(runEvents.execute).not.to.be.calledWith('before:run')
      })
    })

    describe('saved state', function () {
      beforeEach(function () {
        this._time = 1609459200000
        this._dateStub = sinon.stub(Date, 'now').returns(this._time)
      })

      it('sets firstOpened and lastOpened on first open', function () {
        return this.project.open()
        .then(() => {
          const cfg = this.project.getConfig()

          expect(cfg.state).to.eql({ firstOpened: this._time, lastOpened: this._time })
        })
      })

      it('only sets lastOpened on subsequent opens', function () {
        return this.project.open()
        .then(() => {
          this._dateStub.returns(this._time + 100000)
        })
        .then(() => this.project.open())
        .then(() => {
          const cfg = this.project.getConfig()

          expect(cfg.state).to.eql({ firstOpened: this._time, lastOpened: this._time + 100000 })
        })
      })

      it('updates config.state when saved state changes', function () {
        sinon.spy(this.project, 'saveState')

        const options = { onSavedStateChanged: (...args) => this.project.saveState(...args) }

        this.project.__setOptions(options)

        return this.project.open()
        .then(() => options.onSavedStateChanged({ autoScrollingEnabled: false }))
        .then(() => {
          const cfg = this.project.getConfig()

          expect(this.project.saveState).to.be.calledWith({ autoScrollingEnabled: false })

          expect(cfg.state).to.eql({
            autoScrollingEnabled: false,
            firstOpened: this._time,
            lastOpened: this._time,
          })
        })
      })
    })
  })

  context('#close', () => {
    beforeEach(function () {
      this.project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })

      this.project._server = { close () {} }
      this.project._isServerOpen = true

      sinon.stub(this.project, 'getConfig').returns(this.config)

      sinon.stub(user, 'ensureAuthToken').resolves('auth-token-123')
    })

    it('closes server', function () {
      this.project._server = sinon.stub({ close () {} })

      return this.project.close().then(() => {
        expect(this.project._server.close).to.be.calledOnce
      })
    })

    it('closes watchers', function () {
      this.project.watchers = sinon.stub({ close () {} })

      return this.project.close().then(() => {
        expect(this.project.watchers.close).to.be.calledOnce
      })
    })

    it('can close when server + watchers arent open', function () {
      return this.project.close()
    })

    it('executes after:run if in interactive mode', function () {
      this.config.experimentalInteractiveRunEvents = true
      this.config.isTextTerminal = false

      return this.project.close()
      .then(() => {
        expect(runEvents.execute).to.be.calledWith('after:run', this.config)
      })
    })

    it('does not execute after:run if not in interactive mode', function () {
      this.config.experimentalInteractiveRunEvents = true
      this.config.isTextTerminal = true

      return this.project.close()
      .then(() => {
        expect(runEvents.execute).not.to.be.calledWith('after:run')
      })
    })

    it('does not execute after:run if experimental flag is not enabled', function () {
      this.config.experimentalInteractiveRunEvents = false
      this.config.isTextTerminal = false

      return this.project.close()
      .then(() => {
        expect(runEvents.execute).not.to.be.calledWith('after:run')
      })
    })
  })

  context('#reset', () => {
    beforeEach(function () {
      this.project = new ProjectBase({ projectRoot: this.pristinePath, testingType: 'e2e' })
      this.project._automation = { reset: sinon.stub() }
      this.project._server = { close () {}, reset: sinon.stub() }
    })

    it('resets server + automation', function () {
      this.project.reset()
      expect(this.project._automation.reset).to.be.calledOnce

      expect(this.project.server.reset).to.be.calledOnce
    })
  })

  context('#scaffold', () => {
    beforeEach(function () {
      this.project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })
      sinon.stub(scaffold, 'integration').resolves()
      sinon.stub(scaffold, 'fixture').resolves()
      sinon.stub(scaffold, 'support').resolves()
      sinon.stub(scaffold, 'plugins').resolves()

      this.obj = { projectRoot: 'pr', fixturesFolder: 'ff', integrationFolder: 'if', supportFolder: 'sf', pluginsFile: 'pf/index.js' }
    })

    it('calls scaffold.integration with integrationFolder', function () {
      return this.project.scaffold(this.obj).then(() => {
        expect(scaffold.integration).to.be.calledWith(this.obj.integrationFolder)
      })
    })

    it('calls fixture.scaffold with fixturesFolder', function () {
      return this.project.scaffold(this.obj).then(() => {
        expect(scaffold.fixture).to.be.calledWith(this.obj.fixturesFolder)
      })
    })

    it('calls support.scaffold with supportFolder', function () {
      return this.project.scaffold(this.obj).then(() => {
        expect(scaffold.support).to.be.calledWith(this.obj.supportFolder)
      })
    })

    it('does not call support.plugins if config.pluginsFile is falsey', function () {
      this.obj.pluginsFile = false

      return this.project.scaffold(this.obj).then(() => {
        expect(scaffold.plugins).not.to.be.called
      })
    })

    describe('forced', () => {
      let resetEnv

      beforeEach(function () {
        this.obj.isTextTerminal = true
        resetEnv = mockedEnv({
          CYPRESS_INTERNAL_FORCE_SCAFFOLD: '1',
        })
      })

      afterEach(() => {
        resetEnv()
      })

      it('calls scaffold when forced by environment variable', function () {
        return this.project.scaffold(this.obj).then(() => {
          expect(scaffold.integration).to.be.calledWith(this.obj.integrationFolder)
          expect(scaffold.fixture).to.be.calledWith(this.obj.fixturesFolder)
          expect(scaffold.support).to.be.calledWith(this.obj.supportFolder)
        })
      })
    })

    describe('not forced', () => {
      let resetEnv

      beforeEach(function () {
        this.obj.isTextTerminal = true

        resetEnv = mockedEnv({
          CYPRESS_INTERNAL_FORCE_SCAFFOLD: undefined,
        })
      })

      afterEach(() => {
        resetEnv()
      })

      it('does not scaffold integration folder', function () {
        return this.project.scaffold(this.obj).then(() => {
          expect(scaffold.integration).to.not.be.calledWith(this.obj.integrationFolder)
          expect(scaffold.fixture).to.not.be.calledWith(this.obj.fixturesFolder)
          // still scaffolds support folder due to old logic
          expect(scaffold.support).to.be.calledWith(this.obj.supportFolder)
        })
      })
    })
  })

  context('#watchSettings', () => {
    beforeEach(function () {
      this.project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })
      this.project._server = { close () {}, startWebsockets () {} }
      sinon.stub(settings, 'pathToConfigFile').returns('/path/to/cypress.config.js')
      sinon.stub(settings, 'pathToCypressEnvJson').returns('/path/to/cypress.env.json')
      this.watch = sinon.stub(this.project.watchers, 'watch')
      this.watchTree = sinon.stub(this.project.watchers, 'watchTree')
    })

    it('watches cypress.config.js and cypress.env.json', function () {
      this.project.watchSettings({ onSettingsChanged () {} }, {})
      expect(this.watch).to.be.calledOnce
      expect(this.watchTree).to.be.calledOnce
      expect(this.watchTree).to.be.calledWith('/path/to/cypress.config.js')

      expect(this.watch).to.be.calledWith('/path/to/cypress.env.json')
    })

    it('sets onChange event when {changeEvents: true}', function (done) {
      this.project.watchSettings({ onSettingsChanged: () => done() }, {})

      // get the object passed to watchers.watch
      const obj = this.watch.getCall(0).args[1]

      expect(obj.onChange).to.be.a('function')

      obj.onChange()
    })

    it('does not call watch when {changeEvents: false}', function () {
      this.project.watchSettings({ onSettingsChanged: undefined }, {})

      expect(this.watch).not.to.be.called
    })

    it('does not call onSettingsChanged when generatedProjectIdTimestamp is less than 1 second', function () {
      let timestamp = new Date()

      this.project.generatedProjectIdTimestamp = timestamp

      const stub = sinon.stub()

      this.project.watchSettings({ onSettingsChanged: stub }, {})

      // get the object passed to watchers.watch
      const obj = this.watch.getCall(0).args[1]

      obj.onChange()

      expect(stub).not.to.be.called

      // subtract 1 second from our timestamp
      timestamp.setSeconds(timestamp.getSeconds() - 1)

      obj.onChange()

      expect(stub).to.be.calledOnce
    })
  })

  context('#watchPluginsFile', () => {
    beforeEach(function () {
      sinon.stub(fs, 'pathExists').resolves(true)
      this.project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })
      this.project.watchers = { watchTree: sinon.spy() }
      sinon.stub(plugins, 'init').resolves()

      this.config = {
        pluginsFile: '/path/to/plugins-file',
      }
    })

    it('does nothing when {pluginsFile: false}', function () {
      this.config.pluginsFile = false

      return this.project.watchPluginsFile(this.config, {}).then(() => {
        expect(this.project.watchers.watchTree).not.to.be.called
      })
    })

    it('does nothing if pluginsFile does not exist', function () {
      fs.pathExists.resolves(false)

      return this.project.watchPluginsFile(this.config, {}).then(() => {
        expect(this.project.watchers.watchTree).not.to.be.called
      })
    })

    it('does nothing if in run mode', function () {
      return this.project.watchPluginsFile(this.config, {
        isTextTerminal: true,
      }).then(() => {
        expect(this.project.watchers.watchTree).not.to.be.called
      })
    })

    it('watches the pluginsFile', function () {
      return this.project.watchPluginsFile(this.config, {}).then(() => {
        expect(this.project.watchers.watchTree).to.be.calledWith(this.config.pluginsFile)
        expect(this.project.watchers.watchTree.lastCall.args[1]).to.be.an('object')

        expect(this.project.watchers.watchTree.lastCall.args[1].onChange).to.be.a('function')
      })
    })

    it('calls plugins.init when file changes', function () {
      return this.project.watchPluginsFile(this.config, {
        onError: () => {},
      }).then(() => {
        this.project.watchers.watchTree.firstCall.args[1].onChange()

        expect(plugins.init).to.be.calledWith(this.config)
      })
    })

    it('handles errors from calling plugins.init', function (done) {
      const error = { name: 'foo', message: 'foo' }

      plugins.init.rejects(error)

      this.project.watchPluginsFile(this.config, {
        onError (err) {
          expect(err).to.eql(error)

          done()
        },
      })
      .then(() => {
        this.project.watchers.watchTree.firstCall.args[1].onChange()
      })
    })
  })

  context('#startWebsockets', () => {
    beforeEach(function () {
      this.project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })
      this.project.watchers = {}
      this.project._server = { close () {}, startWebsockets: sinon.stub() }
      sinon.stub(ProjectBase.prototype, 'open').resolves()
      sinon.stub(this.project, 'watchSettings')
    })

    it('calls server.startWebsockets with automation + config', async function () {
      const c = {}

      this.project.__setConfig(c)
      this.project.startWebsockets({}, c)

      const args = this.project.server.startWebsockets.lastCall.args

      expect(args[0]).to.be.an.instanceof(Automation)
      expect(args[1]).to.equal(c)
    })

    it('passes onReloadBrowser callback', function () {
      const fn = sinon.stub()

      this.project.server.startWebsockets.yieldsTo('onReloadBrowser')

      this.project.startWebsockets({ onReloadBrowser: fn }, {})

      expect(fn).to.be.calledOnce
    })
  })

  context('#getProjectId', () => {
    beforeEach(function () {
      this.project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })
      this.verifyExistence = sinon.stub(ProjectBase.prototype, 'verifyExistence').resolves()
    })

    it('calls verifyExistence', function () {
      sinon.stub(settings, 'read').resolves({ projectId: 'id-123' })

      return this.project.getProjectId()
      .then(() => expect(this.verifyExistence).to.be.calledOnce)
    })

    it('returns the project id from settings', function () {
      sinon.stub(settings, 'read').resolves({ projectId: 'id-123' })

      return this.project.getProjectId()
      .then((id) => expect(id).to.eq('id-123'))
    })

    it('throws NO_PROJECT_ID with the projectRoot when no projectId was found', function () {
      sinon.stub(settings, 'read').resolves({})

      return this.project.getProjectId()
      .then((id) => {
        throw new Error('expected to fail, but did not')
      }).catch((err) => {
        expect(err.type).to.eq('NO_PROJECT_ID')

        expect(err.message).to.include('/_test-output/path/to/project-e2e')
      })
    })

    it('bubbles up Settings.read EACCES error', function () {
      const err = new Error()

      err.code = 'EACCES'

      sinon.stub(settings, 'read').rejects(err)

      return this.project.getProjectId()
      .then((id) => {
        throw new Error('expected to fail, but did not')
      }).catch((err) => {
        expect(err.code).to.eq('EACCES')
      })
    })

    it('bubbles up Settings.read EPERM error', function () {
      const err = new Error()

      err.code = 'EPERM'

      sinon.stub(settings, 'read').rejects(err)

      return this.project.getProjectId()
      .then((id) => {
        throw new Error('expected to fail, but did not')
      }).catch((err) => {
        expect(err.code).to.eq('EPERM')
      })
    })
  })
})
