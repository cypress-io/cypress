require('../spec_helper')

const path = require('path')
const chokidar = require('chokidar')
const pkg = require('@packages/root')
const Fixtures = require('@tooling/system-tests')
const { sinon } = require('../spec_helper')
const config = require(`../../lib/config`)
const { ServerBase } = require(`../../lib/server-base`)
const { ProjectBase } = require(`../../lib/project-base`)
const { Automation } = require(`../../lib/automation`)
const savedState = require(`../../lib/saved_state`)
const runEvents = require(`../../lib/plugins/run_events`)
const system = require(`../../lib/util/system`)
const { getCtx } = require(`../../lib/makeDataContext`)
const studio = require('../../lib/cloud/api/get_app_studio')

let ctx

// NOTE: todo: come back to this
describe('lib/project-base', () => {
  beforeEach(async function () {
    ctx = getCtx()
    Fixtures.scaffold()

    this.todosPath = Fixtures.projectPath('todos')
    this.idsPath = Fixtures.projectPath('ids')
    this.pristinePath = Fixtures.projectPath('pristine-with-e2e-testing')

    sinon.stub(chokidar, 'watch').returns({
      on: () => {},
      close: () => {},
    })

    sinon.stub(runEvents, 'execute').resolves()

    this.testAppStudio = {
      initializeRoutes: () => {},
    }

    sinon.stub(studio, 'getAppStudio').resolves(this.testAppStudio)

    await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(this.todosPath)
    this.config = await ctx.project.getConfig()

    this.project = new ProjectBase({ projectRoot: this.todosPath, testingType: 'e2e' })
    this.project._server = {
      close () {},
      setProtocolManager () {},
    }

    this.project._cfg = this.config
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
    const p = new ProjectBase({ projectRoot: path.join('..', 'foo', 'bar'), testingType: 'e2e' })

    expect(p.projectRoot).not.to.eq(path.join('..', 'foo', 'bar'))
    expect(p.projectRoot).to.eq(path.resolve(path.join('..', 'foo', 'bar')))
  })

  context('#saveState', function () {
    beforeEach(function () {
      const supportFile = path.join('the', 'save', 'state', 'test')

      this.project.cfg = { supportFile }

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

    it('modifies property', function () {
      return this.project.saveState()
      .then(() => this.project.saveState({ appWidth: 42 }))
      .then(() => this.project.saveState({ appWidth: 'modified' }))
      .then((state) => expect(state).to.deep.eq({ appWidth: 'modified' }))
    })
  })

  context('#initializeConfig', () => {
    const supportFile = path.join('foo', 'bar', 'baz')

    it('resolves with saved state when in open mode', async function () {
      sinon.stub(ctx.lifecycleManager, 'getFullInitialConfig')
      .resolves({
        supportFile,
        isTextTerminal: false,
        baz: 'quux',
      })

      sinon.stub(savedState, 'create')
      .withArgs(this.todosPath, false)
      .resolves({
        get () {
          return { reporterWidth: 225 }
        },
      })

      const cfg = await this.project.initializeConfig()

      expect(cfg).to.deep.eq({
        supportFile,
        isTextTerminal: false,
        baz: 'quux',
        state: {
          reporterWidth: 225,
        },
        testingType: 'e2e',
      })
    })

    it('resolves without saved state when in run mode', async function () {
      sinon.stub(ctx.lifecycleManager, 'getFullInitialConfig')
      .resolves({
        supportFile,
        isTextTerminal: true,
        baz: 'quux',
      })

      const cfg = await this.project.initializeConfig()

      expect(cfg).to.deep.eq({
        supportFile,
        isTextTerminal: true,
        baz: 'quux',
        testingType: 'e2e',
      })

      expect(cfg).to.not.have.property('state')
    })

    // FIXME: NEED TO MOVE TO DATA_CONTEXT PACKAGE
    it.skip('attaches warning to non-chrome browsers when chromeWebSecurity:false', async function () {
      const cfg = Object.assign({}, {
        supportFile,
        browsers: [{ family: 'chromium', name: 'Canary' }, { family: 'some-other-family', name: 'some-other-name' }],
        chromeWebSecurity: false,
      })

      ctx.lifecycleManager.getFullInitialConfig.restore()
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
Your project has set the configuration option: \`chromeWebSecurity\` to \`false\`.

This option will not have an effect in Some-other-name. Tests that rely on web security being disabled will not run as expected.\
`,
          },
        ])

        expect(cfg).ok
      })
    })

    // FIXME: NEED TO MOVE TO DATA_CONTEXT PACKAGE
    // https://github.com/cypress-io/cypress/issues/17614
    it.skip('only attaches warning to non-chrome browsers when chromeWebSecurity:true', async function () {
      ctx.lifecycleManager.restore?.()
      sinon.stub(ctx.lifecycleManager, 'getFullInitialConfig').returns({
        supportFile,
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

  context('#getConfig', () => {
    it('returns the enabled state of the protocol manager if it is defined', function () {
      this.project.protocolManager = {
        protocolEnabled: true,
      }

      const config = this.project.getConfig()

      expect(config.protocolEnabled).to.be.true
    })

    it('returns false for protocolEnabled if the protocol manager is undefined', function () {
      const config = this.project.getConfig()

      expect(config.protocolEnabled).to.be.false
    })

    context('hideCommandLog', () => {
      it('returns true if NO_COMMAND_LOG is set', function () {
        this.project._cfg.env.NO_COMMAND_LOG = 1

        const config = this.project.getConfig()

        expect(config.hideCommandLog).to.be.true
      })

      it('returns false if NO_COMMAND_LOG is not set', function () {
        const config = this.project.getConfig()

        expect(config.hideCommandLog).to.be.false
      })
    })

    context('hideRunnerUi', () => {
      beforeEach(function () {
        this.project.options.args = {}
      })

      it('returns true if runnerUi arg is set to false', function () {
        this.project.options.args.runnerUi = false

        const config = this.project.getConfig()

        expect(config.hideRunnerUi).to.be.true
      })

      it('returns false if runnerUi arg is set to true', function () {
        this.project.options.args.runnerUi = true

        const config = this.project.getConfig()

        expect(config.hideRunnerUi).to.be.false
      })

      it('sets hideCommandLog to true if hideRunnerUi arg is set to true even if NO_COMMAND_LOG is 0', function () {
        this.project.options.args.runnerUi = false
        this.project._cfg.env.NO_COMMAND_LOG = 0

        const config = this.project.getConfig()

        expect(config.hideRunnerUi).to.be.true
        expect(config.hideCommandLog).to.be.true
      })

      it('returns true if runnerUi arg is not set and protocol is enabled', function () {
        this.project.protocolManager = { protocolEnabled: true }

        const config = this.project.getConfig()

        expect(config.hideRunnerUi).to.be.true
      })

      it('returns false if runnerUi arg is not set and protocol is not enabled', function () {
        this.project.protocolManager = { protocolEnabled: false }

        const config = this.project.getConfig()

        expect(config.hideRunnerUi).to.be.false
      })

      it('returns false if runnerUi arg is set to true and protocol is enabled', function () {
        this.project.protocolManager = { protocolEnabled: true }
        this.project.options.args.runnerUi = true

        const config = this.project.getConfig()

        expect(config.hideRunnerUi).to.be.false
      })
    })
  })

  context('#open', () => {
    beforeEach(function () {
      sinon.stub(this.project, 'startWebsockets')
      sinon.stub(this.project, 'getConfig').returns(this.config)
      sinon.stub(ServerBase.prototype, 'open').resolves([])
      sinon.stub(ServerBase.prototype, 'reset')
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
          socketIoCookie: '__socket',
          namespace: '__cypress',
          screenshotsFolder: path.join(this.project.projectRoot, 'cypress', 'screenshots'),
          report: undefined,
          reporter: 'spec',
          reporterOptions: null,
          projectRoot: this.todosPath,
        })
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
        expect(runEvents.execute).to.be.calledWith('before:run', {
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

    // FIXME: NEED TO MOVE TO DATA_CONTEXT PACKAGE
    it.skip('does not call startSpecWatcher if not in interactive mode', function () {
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

    // FIXME: NEED TO MOVE TO DATA_CONTEXT PACKAGE
    it.skip('calls startSpecWatcher if in interactive mode', function () {
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

    it('gets app studio for the project id if CYPRESS_ENABLE_CLOUD_STUDIO is set', async function () {
      process.env.CYPRESS_ENABLE_CLOUD_STUDIO = '1'

      await this.project.open()

      expect(studio.getAppStudio).to.be.calledWith('abc123')
      expect(ctx.coreData.studio).to.eq(this.testAppStudio)
    })

    it('gets app studio for the project id if CYPRESS_LOCAL_STUDIO_PATH is set', async function () {
      process.env.CYPRESS_LOCAL_STUDIO_PATH = '/path/to/app/studio'

      await this.project.open()

      expect(studio.getAppStudio).to.be.calledWith('abc123')
      expect(ctx.coreData.studio).to.eq(this.testAppStudio)
    })

    it('does not get app studio if neither CYPRESS_ENABLE_CLOUD_STUDIO nor CYPRESS_LOCAL_STUDIO_PATH is set', async function () {
      await this.project.open()
      expect(studio.getAppStudio).not.to.be.called
      expect(ctx.coreData.studio).to.be.null
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

          expect(cfg.state).to.eql({
            firstOpened: this._time,
            lastOpened: this._time,
            lastProjectId: 'abc123',
          })
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

          expect(cfg.state).to.eql({
            firstOpened: this._time,
            lastOpened: this._time + 100000,
            lastProjectId: 'abc123',
          })
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
            lastProjectId: 'abc123',
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
    })

    it('closes server', function () {
      this.project._server = sinon.stub({ close () {} })

      return this.project.close().then(() => {
        expect(this.project._server.close).to.be.calledOnce
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
        expect(runEvents.execute).to.be.calledWith('after:run')
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

  context('#startWebsockets', () => {
    beforeEach(function () {
      this.project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })
      this.project.watchers = {}
      this.project._server = { close () {}, startWebsockets: sinon.stub() }
      sinon.stub(ProjectBase.prototype, 'open').resolves()
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
      sinon.stub(ctx.lifecycleManager, 'getProjectId').resolves('id-123')
    })

    it('returns the project id from data-context', function () {
      return this.project.getProjectId()
      .then((id) => {
        expect(ctx.lifecycleManager.getProjectId).to.be.calledOnce
        expect(id).to.eq('id-123')
      })
    })
  })
})

describe('lib/project-base #isRunnerSocketConnected', () => {
  it('calls through to socket method', () => {
    const isRunnerSocketConnected = sinon.stub().returns(true)

    this.project = new ProjectBase({ projectRoot: Fixtures.projectPath('todos'), testingType: 'e2e' })
    this.project._server = {
      socket: {
        isRunnerSocketConnected,
      },
    }

    const result = this.project.isRunnerSocketConnected()

    expect(result).to.eq(true)
    expect(isRunnerSocketConnected).to.have.been.calledOnce
  })
})
