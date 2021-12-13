import sinon from 'sinon'
import { ProjectLifecycleManager, Ctx_ProjectLifecycleManager } from '../../src/data/ProjectLifecycleManager'

function fakeCtx (): Ctx_ProjectLifecycleManager {
  return {
    fs: sinon.stub() as any,

  }
}

describe('ProjectLifecycleManager', () => {
  describe('constructor', () => {
    it('should check for & warn if ', () => {

    })
  })

  function FakeDataContext () {
    return {
      fs: {
        readJSON: sinon.stub(),
        stat: sinon.stub(),
      },

    }
  }

  context('Creation', () => {
    it('Guards against legacy plugins')

    it('Loads the global browsers')

    it('')
  })

  context('')
})

// # -----
// - Project:
//   - configNeedsMigration
//   - hasLegacyCypressJson??
//   - hasDuplicateCypressConfig
//   - currentTestingType
//   - testingTypes
//     - isConfigured
//   - configError
//   - setupCurrentTestingTypeError
// # -----

// // TODO: skip this for now
// it.skip('watches cypress.config.js', function () {
//   return this.server.open().bind(this).then(() => {
//     expect(Watchers.prototype.watch).to.be.calledWith('/Users/brian/app/cypress.config.js')
//   })
// })
// xit('does not watch settings or plugins in run mode', function () {
//   const watch = sinon.spy(Watchers.prototype, 'watch')
//   const watchTree = sinon.spy(Watchers.prototype, 'watchTree')
//   return cypress.start([`--run-project=${this.pluginConfig}`])
//   .then(() => {
//     expect(watchTree).not.to.be.called
//     expect(watch).not.to.be.called
//     this.expectExitWith(0)
//   })
// })
// context('.readEnv', () => {
//   afterEach(() => {
//     return fs.removeAsync('cypress.env.json')
//   })
//   it('parses json', () => {
//     const json = { foo: 'bar', baz: 'quux' }
//     fs.writeJsonSync('cypress.env.json', json)
//     return settings.readEnv(projectRoot)
//     .then((obj) => {
//       expect(obj).to.deep.eq(json)
//     })
//   })
//   it('throws when invalid json', () => {
//     fs.writeFileSync('cypress.env.json', '{\'foo;: \'bar}')
//     return settings.readEnv(projectRoot)
//     .catch((err) => {
//       expect(err.type).to.eq('ERROR_READING_FILE')
//       expect(err.message).to.include('SyntaxError')
//       expect(err.message).to.include(projectRoot)
//     })
//   })
//   it('does not write initial file', () => {
//     return settings.readEnv(projectRoot)
//     .then((obj) => {
//       expect(obj).to.deep.eq({})
//     }).then(() => {
//       return fs.pathExists('cypress.env.json')
//     }).then((found) => {
//       expect(found).to.be.false
//     })
//   })
// })
// xcontext('#watchSettings', () => {
//   beforeEach(function () {
//     this.project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })
//     this.project._server = { close () {}, startWebsockets () {} }
//     sinon.stub(settings, 'pathToConfigFile').returns('/path/to/cypress.config.js')
//     sinon.stub(settings, 'pathToCypressEnvJson').returns('/path/to/cypress.env.json')
//     this.watch = sinon.stub(this.project.watchers, 'watch')
//     this.watchTree = sinon.stub(this.project.watchers, 'watchTree')
//   })
//   it('watches cypress.config.js and cypress.env.json', function () {
//     this.project.watchSettings({ onSettingsChanged () {} }, {})
//     expect(this.watch).to.be.calledOnce
//     expect(this.watchTree).to.be.calledOnce
//     expect(this.watchTree).to.be.calledWith('/path/to/cypress.config.js')
//     expect(this.watch).to.be.calledWith('/path/to/cypress.env.json')
//   })
//   it('sets onChange event when {changeEvents: true}', function (done) {
//     this.project.watchSettings({ onSettingsChanged: () => done() }, {})
//     // get the object passed to watchers.watch
//     const obj = this.watch.getCall(0).args[1]
//     expect(obj.onChange).to.be.a('function')
//     obj.onChange()
//   })
//   it('does not call watch when {changeEvents: false}', function () {
//     this.project.watchSettings({ onSettingsChanged: undefined }, {})
//     expect(this.watch).not.to.be.called
//   })
//   it('does not call onSettingsChanged when generatedProjectIdTimestamp is less than 1 second', function () {
//     let timestamp = new Date()
//     this.project.generatedProjectIdTimestamp = timestamp
//     const stub = sinon.stub()
//     this.project.watchSettings({ onSettingsChanged: stub }, {})
//     // get the object passed to watchers.watch
//     const obj = this.watch.getCall(0).args[1]
//     obj.onChange()
//     expect(stub).not.to.be.called
//     // subtract 1 second from our timestamp
//     timestamp.setSeconds(timestamp.getSeconds() - 1)
//     obj.onChange()
//     expect(stub).to.be.calledOnce
//   })
// })
// xcontext('#watchPluginsFile', () => {
//   beforeEach(function () {
//     sinon.stub(fs, 'pathExists').resolves(true)
//     this.project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })
//     this.project.watchers = { watchTree: sinon.spy() }
//     sinon.stub(plugins, 'init').resolves()
//     this.config = {
//       pluginsFile: '/path/to/plugins-file',
//     }
//   })
//   it('does nothing when {pluginsFile: false}', function () {
//     this.config.pluginsFile = false
//     return this.project.watchPluginsFile(this.config, {}).then(() => {
//       expect(this.project.watchers.watchTree).not.to.be.called
//     })
//   })
//   it('does nothing if pluginsFile does not exist', function () {
//     fs.pathExists.resolves(false)
//     return this.project.watchPluginsFile(this.config, {}).then(() => {
//       expect(this.project.watchers.watchTree).not.to.be.called
//     })
//   })
//   it('does nothing if in run mode', function () {
//     return this.project.watchPluginsFile(this.config, {
//       isTextTerminal: true,
//     }).then(() => {
//       expect(this.project.watchers.watchTree).not.to.be.called
//     })
//   })
//   it('watches the pluginsFile', function () {
//     return this.project.watchPluginsFile(this.config, {}).then(() => {
//       expect(this.project.watchers.watchTree).to.be.calledWith(this.config.pluginsFile)
//       expect(this.project.watchers.watchTree.lastCall.args[1]).to.be.an('object')
//       expect(this.project.watchers.watchTree.lastCall.args[1].onChange).to.be.a('function')
//     })
//   })
//   it('calls plugins.init when file changes', function () {
//     return this.project.watchPluginsFile(this.config, {
//       onError: () => {},
//     }).then(() => {
//       this.project.watchers.watchTree.firstCall.args[1].onChange()
//       expect(plugins.init).to.be.calledWith(this.config)
//     })
//   })
//   it('handles errors from calling plugins.init', function (done) {
//     const error = { name: 'foo', message: 'foo' }
//     plugins.init.rejects(error)
//     this.project.watchPluginsFile(this.config, {
//       onError (err) {
//         expect(err).to.eql(error)
//         done()
//       },
//     })
//     .then(() => {
//       this.project.watchers.watchTree.firstCall.args[1].onChange()
//     })
//   })
// })
