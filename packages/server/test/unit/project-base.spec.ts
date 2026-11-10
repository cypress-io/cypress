import '../../lib/environment'

import { deepStrictEqual } from 'assert'
import path from 'path'
import _ from 'lodash'
import nock from 'nock'
import chokidar from 'chokidar'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import pkg from '@packages/root'
import Fixtures from '@tooling/system-tests'
import * as config from '../../lib/config'
import { ServerBase } from '../../lib/server-base'
import { ProjectBase } from '../../lib/project-base'
import { Automation } from '../../lib/automation'
import * as savedState from '../../lib/saved_state'
import runEvents from '../../lib/plugins/run_events'
import * as system from '../../lib/util/system'
import { clearCtx, getCtx, makeDataContext, setCtx } from '../../lib/makeDataContext'
import browsers from '../../lib/browsers'
import { CyPromptLifecycleManager } from '../../lib/cloud/cy-prompt/CyPromptLifecycleManager'
import { StudioLifecycleManager } from '../../lib/cloud/studio/StudioLifecycleManager'
import { StudioManager } from '../../lib/cloud/studio/studio'
import { telemetryManager, MARK_NAMES, TELEMETRY_GROUP_NAMES } from '../../lib/cloud/studio/telemetry/TelemetryManager'
import { TelemetryReporter } from '../../lib/cloud/studio/telemetry/TelemetryReporter'

// Building the real schemas in this worker loads a second `graphql` realm, which `graphql` rejects.
vi.mock('@packages/data-context/graphql/schema', () => {
  return { graphqlSchema: {} }
})

vi.mock('@packages/data-context/graphql', () => {
  return { remoteSchemaWrapped: {} }
})

type CallRecorder = { mock: { calls: unknown[][] } }

const callsMatching = (mock: CallRecorder, expected: unknown[]) => {
  return mock.mock.calls.filter((call) => {
    try {
      deepStrictEqual(call.slice(0, expected.length), expected)

      return true
    } catch {
      return false
    }
  })
}

// sinon's calledWith matches a prefix of the recorded arguments, where vitest's
// toHaveBeenCalledWith requires the exact arity
const expectCalledWith = (mock: CallRecorder, ...expected: unknown[]) => {
  expect(callsMatching(mock, expected), `calls matching ${String(expected[0])}`).not.toHaveLength(0)
}

const expectNotCalledWith = (mock: CallRecorder, ...expected: unknown[]) => {
  expect(callsMatching(mock, expected), `calls matching ${String(expected[0])}`).toHaveLength(0)
}

const stubAccessor = (obj: object, prop: string, get: () => unknown, set: (val: unknown) => void) => {
  Object.defineProperty(obj, prop, { configurable: true, get, set })
}

const originalEnv = _.clone(process.env)

let ctx
let project
let projectConfig
let todosPath: string
let pristinePath: string

// Both suites need a live data context; ProjectBase reads it in its constructor.
beforeEach(async () => {
  await clearCtx()
  setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))

  nock.disableNetConnect()
  nock.enableNetConnect(/localhost/)
})

afterEach(async () => {
  await getCtx()._reset()
  await clearCtx()
  vi.restoreAllMocks()

  nock.cleanAll()
  nock.enableNetConnect()

  process.env = _.clone(originalEnv)
})

// NOTE: todo: come back to this
describe('lib/project-base', () => {
  beforeEach(async () => {
    delete process.env.CYPRESS_LOCAL_STUDIO_PATH
    delete process.env.CYPRESS_INTERNAL_SIMULATE_OPEN_MODE

    ctx = getCtx()

    vi.spyOn(ctx.browser, 'machineBrowsers').mockResolvedValue([
      {
        channel: 'stable',
        displayName: 'Electron',
        family: 'chromium',
        majorVersion: '123',
        name: 'electron',
        path: 'path-to-browser-one',
        version: '123.45.67',
      },
    ])

    Fixtures.scaffold()

    todosPath = Fixtures.projectPath('todos')
    pristinePath = Fixtures.projectPath('pristine-with-e2e-testing')

    vi.spyOn(chokidar, 'watch').mockReturnValue({
      on: () => {},
      close: () => {},
    })

    vi.spyOn(runEvents, 'execute').mockResolvedValue(undefined)

    await ctx.actions.project.setCurrentProjectAndTestingTypeForTestSetup(todosPath)
    projectConfig = await ctx.project.getConfig()

    project = new ProjectBase({ projectRoot: todosPath, testingType: 'e2e' })
    project._server = {
      close () {},
      setProtocolManager () {},
    }

    project._cfg = projectConfig
  })

  afterEach(async () => {
    Fixtures.remove()

    if (project) {
      await project.close()
    }
  })

  it('requires a projectRoot', () => {
    const fn = () => new ProjectBase({})

    expect(fn).toThrow('Instantiating lib/project requires a projectRoot!')
  })

  it('always resolves the projectRoot to be absolute', () => {
    const p = new ProjectBase({ projectRoot: path.join('..', 'foo', 'bar'), testingType: 'e2e' })

    expect(p.projectRoot).not.toBe(path.join('..', 'foo', 'bar'))
    expect(p.projectRoot).toBe(path.resolve(path.join('..', 'foo', 'bar')))
  })

  describe('#getSavedState', () => {
    beforeEach(async () => {
      const globalState = await savedState.create()

      await globalState.remove()
      await globalState.set({ reporterWidth: 400 })

      const projectState = await savedState.create(project.projectRoot)

      await projectState.remove()
      await projectState.set({ reporterWidth: 500 })
    })

    it('returns global state when type is global', async () => {
      const state = await project.getSavedState({ type: 'global' })

      expect(state).toStrictEqual({ reporterWidth: 400 })
    })

    it('returns project state when type is project', async () => {
      const state = await project.getSavedState({ type: 'project' })

      expect(state).toStrictEqual({ reporterWidth: 500 })
    })

    it('returns project state when type is undefined', async () => {
      const state = await project.getSavedState()

      expect(state).toStrictEqual({ reporterWidth: 500 })
    })
  })

  describe('#saveState', () => {
    beforeEach(async () => {
      const globalState = await savedState.create()

      await globalState.remove()

      const projectState = await savedState.create(project.projectRoot)

      await projectState.remove()
    })

    afterEach(() => {
      return savedState.create(project.projectRoot)
      .then((state) => state.remove())
    })

    it('saves state without modification', () => {
      return project.saveState()
      .then((state) => expect(state).toStrictEqual({}))
    })

    it('adds property', () => {
      return project.saveState()
      .then(() => project.saveState({ appWidth: 42 }))
      .then((state) => expect(state).toStrictEqual({ appWidth: 42 }))
    })

    it('adds second property', () => {
      return project.saveState()
      .then(() => project.saveState({ appWidth: 42 }))
      .then(() => project.saveState({ appHeight: true }))
      .then((state) => expect(state).toStrictEqual({ appWidth: 42, appHeight: true }))
    })

    it('modifies property', () => {
      return project.saveState()
      .then(() => project.saveState({ appWidth: 42 }))
      .then(() => project.saveState({ appWidth: 'modified' }))
      .then((state) => expect(state).toStrictEqual({ appWidth: 'modified' }))
    })

    it('saves global state when type is global', async () => {
      await project.saveState({ reporterWidth: 1 }, { type: 'global' })

      const state = await savedState.create()
      .then((state) => state.get())

      expect(state).toStrictEqual({ reporterWidth: 1 })
    })

    it('saves project state when type is project', async () => {
      await project.saveState({ reporterWidth: 2 }, { type: 'project' })

      const state = await savedState.create(project.projectRoot)
      .then((state) => state.get())

      expect(state).toStrictEqual({ reporterWidth: 2 })
    })

    it('saves project state when type is undefined', async () => {
      await project.saveState({ reporterWidth: 3 })

      const state = await savedState.create(project.projectRoot)
      .then((state) => state.get())

      expect(state).toStrictEqual({ reporterWidth: 3 })
    })
  })

  describe('#initializeConfig', () => {
    const supportFile = path.join('foo', 'bar', 'baz')

    it('resolves with saved state when in open mode', async () => {
      vi.spyOn(ctx.lifecycleManager, 'getFullInitialConfig')
      .mockResolvedValue({
        supportFile,
        isTextTerminal: false,
        baz: 'quux',
      })

      // a sinon withArgs stub: any other arguments get undefined
      vi.spyOn(savedState, 'create').mockImplementation((...args) => {
        if (args[0] === todosPath && args[1] === false) {
          return Promise.resolve({
            get () {
              return { reporterWidth: 225 }
            },
          } as any)
        }

        return undefined as any
      })

      const cfg = await project.initializeConfig()

      expect(cfg).toStrictEqual({
        supportFile,
        isTextTerminal: false,
        baz: 'quux',
        state: {
          reporterWidth: 225,
        },
        testingType: 'e2e',
      })
    })

    it('resolves without saved state when in run mode', async () => {
      vi.spyOn(ctx.lifecycleManager, 'getFullInitialConfig')
      .mockResolvedValue({
        supportFile,
        isTextTerminal: true,
        baz: 'quux',
      })

      const cfg = await project.initializeConfig()

      expect(cfg).toStrictEqual({
        supportFile,
        isTextTerminal: true,
        baz: 'quux',
        testingType: 'e2e',
      })

      expect(cfg).not.toHaveProperty('state')
    })

    // FIXME: NEED TO MOVE TO DATA_CONTEXT PACKAGE
    it.skip('attaches warning to non-chrome browsers when chromeWebSecurity:false', async () => {
      const cfg = Object.assign({}, {
        supportFile,
        browsers: [{ family: 'chromium', name: 'Canary' }, { family: 'some-other-family', name: 'some-other-name' }],
        chromeWebSecurity: false,
      })

      ctx.lifecycleManager.getFullInitialConfig.mockRestore()
      vi.spyOn(config, 'get').mockReturnValue(cfg)

      await project.initializeConfig()
      .then(() => {
        const cfg = project.getConfig()

        expect(cfg.chromeWebSecurity).toBe(false)
        expect(cfg.browsers).toStrictEqual([
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

        expect(cfg).toBeTruthy()
      })
    })

    // FIXME: NEED TO MOVE TO DATA_CONTEXT PACKAGE
    // https://github.com/cypress-io/cypress/issues/17614
    it.skip('only attaches warning to non-chrome browsers when chromeWebSecurity:true', async () => {
      ctx.lifecycleManager.restore?.()
      vi.spyOn(ctx.lifecycleManager, 'getFullInitialConfig').mockReturnValue({
        supportFile,
        browsers: [{ family: 'chromium', name: 'Canary' }, { family: 'some-other-family', name: 'some-other-name' }],
        chromeWebSecurity: true,
      })

      await project.initializeConfig()
      .then(() => {
        const cfg = project.getConfig()

        expect(cfg.chromeWebSecurity).toBe(true)
        expect(cfg.browsers).toStrictEqual([
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

  describe('#getConfig', () => {
    it('returns the enabled state of the protocol manager if it is defined', () => {
      project.protocolManager = {
        isProtocolEnabled: true,
      }

      const config = project.getConfig()

      expect(config.isDefaultProtocolEnabled).toBe(true)
    })

    it('returns false for isDefaultProtocolEnabled if the protocol manager is undefined', () => {
      const config = project.getConfig()

      expect(config.isDefaultProtocolEnabled).toBe(false)
    })

    describe('hideCommandLog', () => {
      it('returns true if NO_COMMAND_LOG is set', () => {
        project._cfg.env.NO_COMMAND_LOG = 1

        const config = project.getConfig()

        expect(config.hideCommandLog).toBe(true)
      })

      it('returns false if NO_COMMAND_LOG is not set', () => {
        const config = project.getConfig()

        expect(config.hideCommandLog).toBe(false)
      })
    })

    describe('hideRunnerUi', () => {
      beforeEach(() => {
        project.options.args = {}
      })

      it('returns true if runnerUi arg is set to false', () => {
        project.options.args.runnerUi = false

        const config = project.getConfig()

        expect(config.hideRunnerUi).toBe(true)
      })

      it('returns false if runnerUi arg is set to true', () => {
        project.options.args.runnerUi = true

        const config = project.getConfig()

        expect(config.hideRunnerUi).toBe(false)
      })

      it('returns true if runnerUi arg is not set and protocol is enabled', () => {
        project.protocolManager = { isProtocolEnabled: true }
        project.cfg.isTextTerminal = true

        const config = project.getConfig()

        expect(config.hideRunnerUi).toBe(true)
      })

      it('returns false if runnerUi arg is not set and protocol is not enabled', () => {
        project.protocolManager = { isProtocolEnabled: false }
        project.cfg.isTextTerminal = true

        const config = project.getConfig()

        expect(config.hideRunnerUi).toBe(false)
      })

      it('returns false if runnerUi arg is set to true and protocol is enabled', () => {
        project.protocolManager = { isProtocolEnabled: true }
        project.options.args.runnerUi = true
        project.cfg.isTextTerminal = true

        const config = project.getConfig()

        expect(config.hideRunnerUi).toBe(false)
      })

      it('sets hideCommandLog to true if hideRunnerUi arg is set to true even if NO_COMMAND_LOG is 0', () => {
        project.options.args.runnerUi = false
        project._cfg.env.NO_COMMAND_LOG = 0

        const config = project.getConfig()

        expect(config.hideRunnerUi).toBe(true)
        expect(config.hideCommandLog).toBe(true)
      })

      it('returns true if in run mode and protocol is enabled', () => {
        project.protocolManager = { isProtocolEnabled: true }
        project.cfg.isTextTerminal = true

        const config = project.getConfig()

        expect(config.hideRunnerUi).toBe(true)
      })
    })

    describe('isInteractive', () => {
      afterEach(() => {
        delete process.env.CYPRESS_INTERNAL_SIMULATE_OPEN_MODE
      })

      it('returns true in open mode', () => {
        project.cfg.isTextTerminal = false

        const config = project.getConfig()

        expect(config.isInteractive).toBe(true)
      })

      it('returns false in run mode', () => {
        project.cfg.isTextTerminal = true

        const config = project.getConfig()

        expect(config.isInteractive).toBe(false)
      })

      it('returns true in run mode when CYPRESS_INTERNAL_SIMULATE_OPEN_MODE is set', () => {
        project.cfg.isTextTerminal = true
        process.env.CYPRESS_INTERNAL_SIMULATE_OPEN_MODE = '1'

        const config = project.getConfig()

        expect(config.isInteractive).toBe(true)
      })
    })
  })

  describe('#open', () => {
    beforeEach(() => {
      vi.spyOn(project, 'startWebsockets').mockImplementation(() => undefined)
      vi.spyOn(project, 'getConfig').mockReturnValue(projectConfig)
      vi.spyOn(ServerBase.prototype, 'open').mockResolvedValue([])
      vi.spyOn(ServerBase.prototype, 'reset').mockImplementation(() => undefined)
    })

    it('calls #startWebsockets with options + config', () => {
      const onFocusTests = vi.fn()

      project.__setOptions({
        onFocusTests,
      })

      return project.open().then(() => {
        expectCalledWith(project.startWebsockets, {
          onReloadBrowser: undefined,
          onFocusTests,
          onSpecChanged: undefined,
        }, {
          socketIoCookie: '__socket',
          namespace: '__cypress',
          screenshotsFolder: path.join(project.projectRoot, 'cypress', 'screenshots'),
          report: undefined,
          reporter: 'spec',
          reporterOptions: null,
          projectRoot: todosPath,
        })
      })
    })

    it('executes before:run if in interactive mode', () => {
      const sysInfo = {
        osName: 'darwin',
        osVersion: '1.2.3',
      }

      vi.spyOn(system, 'info').mockResolvedValue(sysInfo)
      projectConfig.experimentalInteractiveRunEvents = true
      projectConfig.isTextTerminal = false

      return project.open()
      .then(() => {
        expectCalledWith(vi.mocked(runEvents.execute), 'before:run', {
          config: projectConfig,
          cypressVersion: pkg.version,
          system: sysInfo,
        })
      })
    })

    it('does not get system info or execute before:run if not in interactive mode', () => {
      vi.spyOn(system, 'info').mockImplementation(() => undefined)
      projectConfig.experimentalInteractiveRunEvents = true
      projectConfig.isTextTerminal = true

      return project.open()
      .then(() => {
        expect(system.info).not.toHaveBeenCalled()
        expectNotCalledWith(vi.mocked(runEvents.execute), 'before:run')
      })
    })

    // FIXME: NEED TO MOVE TO DATA_CONTEXT PACKAGE
    it.skip('does not call startSpecWatcher if not in interactive mode', () => {
      const startSpecWatcherStub = vi.fn()

      vi.spyOn(ProjectBase.prototype, 'initializeSpecStore').mockResolvedValue({
        startSpecWatcher: startSpecWatcherStub,
      })

      projectConfig.isTextTerminal = true

      return project.open()
      .then(() => {
        expect(startSpecWatcherStub).not.toHaveBeenCalled()
      })
    })

    // FIXME: NEED TO MOVE TO DATA_CONTEXT PACKAGE
    it.skip('calls startSpecWatcher if in interactive mode', () => {
      const startSpecWatcherStub = vi.fn()

      vi.spyOn(ProjectBase.prototype, 'initializeSpecStore').mockResolvedValue({
        startSpecWatcher: startSpecWatcherStub,
      })

      projectConfig.isTextTerminal = false

      return project.open()
      .then(() => {
        expect(startSpecWatcherStub).toHaveBeenCalled()
      })
    })

    it('does not get system info or execute before:run if experimental flag is not enabled', () => {
      vi.spyOn(system, 'info').mockImplementation(() => undefined)
      projectConfig.experimentalInteractiveRunEvents = false
      projectConfig.isTextTerminal = false

      return project.open()
      .then(() => {
        expect(system.info).not.toHaveBeenCalled()
        expectNotCalledWith(vi.mocked(runEvents.execute), 'before:run')
      })
    })

    describe('CyPromptLifecycleManager', () => {
      let initializeCyPromptManagerStub

      afterEach(() => {
        initializeCyPromptManagerStub.mockRestore()
      })

      it('initializes cy prompt lifecycle manager', () => {
        projectConfig.projectId = 'abc123'
        project.options.record = true
        project.options.key = '123e4567-e89b-12d3-a456-426614174000'

        initializeCyPromptManagerStub = vi.spyOn(CyPromptLifecycleManager.prototype, 'initializeCyPromptManager').mockImplementation(() => undefined)

        return project.open()
        .then(() => {
          expectCalledWith(initializeCyPromptManagerStub, {
            cloudDataSource: ctx.cloud,
            ctx,
            record: true,
            key: '123e4567-e89b-12d3-a456-426614174000',
            projectId: 'abc123',
          })
        })
      })

      it('initializes cy prompt lifecycle manager in open mode without a projectId', () => {
        projectConfig.projectId = undefined
        projectConfig.isTextTerminal = false

        initializeCyPromptManagerStub = vi.spyOn(CyPromptLifecycleManager.prototype, 'initializeCyPromptManager').mockImplementation(() => undefined)

        return project.open()
        .then(() => {
          expect(initializeCyPromptManagerStub).toHaveBeenCalled()
        })
      })

      it('does not initialize cy prompt lifecycle manager in run mode without a projectId', () => {
        projectConfig.projectId = undefined
        projectConfig.isTextTerminal = true

        initializeCyPromptManagerStub = vi.spyOn(CyPromptLifecycleManager.prototype, 'initializeCyPromptManager').mockImplementation(() => undefined)

        return project.open()
        .then(() => {
          expect(initializeCyPromptManagerStub).not.toHaveBeenCalled()
        })
      })

      it('does not initialize cy prompt lifecycle manager when recording without a projectId', () => {
        projectConfig.projectId = undefined
        projectConfig.isTextTerminal = true
        project.options.record = true
        project.options.key = '123e4567-e89b-12d3-a456-426614174000'

        initializeCyPromptManagerStub = vi.spyOn(CyPromptLifecycleManager.prototype, 'initializeCyPromptManager').mockImplementation(() => undefined)

        return project.open()
        .then(() => {
          expect(initializeCyPromptManagerStub).not.toHaveBeenCalled()
        })
      })

      it('initializes cy prompt lifecycle manager in run mode without a projectId when simulating open mode', () => {
        projectConfig.projectId = undefined
        projectConfig.isTextTerminal = true
        process.env.CYPRESS_INTERNAL_SIMULATE_OPEN_MODE = '1'

        initializeCyPromptManagerStub = vi.spyOn(CyPromptLifecycleManager.prototype, 'initializeCyPromptManager').mockImplementation(() => undefined)

        return project.open()
        .then(() => {
          expect(initializeCyPromptManagerStub).toHaveBeenCalled()
        })
        .finally(() => {
          delete process.env.CYPRESS_INTERNAL_SIMULATE_OPEN_MODE
        })
      })

      it('initializes cy prompt lifecycle manager in run mode without a projectId when the bundle is local', () => {
        projectConfig.projectId = undefined
        projectConfig.isTextTerminal = true
        process.env.CYPRESS_LOCAL_CY_PROMPT_PATH = '/path/to/cy-prompt'

        initializeCyPromptManagerStub = vi.spyOn(CyPromptLifecycleManager.prototype, 'initializeCyPromptManager').mockImplementation(() => undefined)

        return project.open()
        .then(() => {
          expect(initializeCyPromptManagerStub).toHaveBeenCalled()
        })
        .finally(() => {
          delete process.env.CYPRESS_LOCAL_CY_PROMPT_PATH
        })
      })
    })

    describe('saved state', () => {
      let time
      let dateStub

      beforeEach(() => {
        time = 1609459200000
        dateStub = vi.spyOn(Date, 'now').mockReturnValue(time)
      })

      it('sets firstOpened and lastOpened on first open', () => {
        return project.open()
        .then(() => {
          const cfg = project.getConfig()

          expect(cfg.state).toStrictEqual({
            firstOpened: time,
            lastOpened: time,
            lastProjectId: 'abc123',
          })
        })
      })

      it('only sets lastOpened on subsequent opens', () => {
        return project.open()
        .then(() => {
          dateStub.mockReturnValue(time + 100000)
        })
        .then(() => project.open())
        .then(() => {
          const cfg = project.getConfig()

          expect(cfg.state).toStrictEqual({
            firstOpened: time,
            lastOpened: time + 100000,
            lastProjectId: 'abc123',
          })
        })
      })

      it('updates config.state when saved state changes', () => {
        vi.spyOn(project, 'saveState')

        const options = { onSavedStateChanged: (...args) => project.saveState(...args) }

        project.__setOptions(options)

        return project.open()
        .then(() => options.onSavedStateChanged({ autoScrollingEnabled: false }))
        .then(() => {
          const cfg = project.getConfig()

          expectCalledWith(project.saveState, { autoScrollingEnabled: false })

          expect(cfg.state).toStrictEqual({
            autoScrollingEnabled: false,
            firstOpened: time,
            lastOpened: time,
            lastProjectId: 'abc123',
          })
        })
      })
    })

    describe('studio initialization', () => {
      it('does not create studio lifecycle manager when in text terminal mode', async () => {
        project.cfg.isTextTerminal = true
        vi.spyOn(project, 'saveState').mockResolvedValue(undefined)

        vi.spyOn(process, 'chdir').mockImplementation(() => undefined)

        await project.open()

        expect(project.ctx.coreData.studioLifecycleManager).toBeUndefined()
      })

      it('does not create studio lifecycle manager for component testing', async () => {
        project.testingType = 'component'

        vi.spyOn(project, 'saveState').mockResolvedValue(undefined)

        vi.spyOn(process, 'chdir').mockImplementation(() => undefined)

        await project.open()

        expect(project.ctx.coreData.studioLifecycleManager).toBeUndefined()
      })

      it('creates studio lifecycle manager for e2e testing', async () => {
        vi.spyOn(project, 'saveState').mockResolvedValue(undefined)

        vi.spyOn(process, 'chdir').mockImplementation(() => undefined)

        await project.open()

        expect(project.ctx.coreData.studioLifecycleManager).not.toBeUndefined()
      })

      it('creates studio lifecycle manager when CYPRESS_INTERNAL_SIMULATE_OPEN_MODE is set even in text terminal mode', async () => {
        project.cfg.isTextTerminal = true
        process.env.CYPRESS_INTERNAL_SIMULATE_OPEN_MODE = '1'

        vi.spyOn(project, 'saveState').mockResolvedValue(undefined)
        vi.spyOn(process, 'chdir').mockImplementation(() => undefined)

        await project.open()

        expect(project.ctx.coreData.studioLifecycleManager).not.toBeUndefined()

        // Clean up environment variable
        delete process.env.CYPRESS_INTERNAL_SIMULATE_OPEN_MODE
      })
    })
  })

  describe('#close', () => {
    // shadows the outer project so the outer afterEach still closes the todos project
    let project

    beforeEach(() => {
      project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })

      project._server = { close () {} }
      project._isServerOpen = true

      vi.spyOn(project, 'getConfig').mockReturnValue(projectConfig)
    })

    it('closes server', () => {
      project._server = { close: vi.fn() }

      return project.close().then(() => {
        expect(project._server.close).toHaveBeenCalledOnce()
      })
    })

    it('can close when server + watchers arent open', () => {
      return project.close()
    })

    it('executes after:run if in interactive mode', () => {
      projectConfig.experimentalInteractiveRunEvents = true
      projectConfig.isTextTerminal = false

      return project.close()
      .then(() => {
        expectCalledWith(vi.mocked(runEvents.execute), 'after:run')
      })
    })

    it('does not execute after:run if not in interactive mode', () => {
      projectConfig.experimentalInteractiveRunEvents = true
      projectConfig.isTextTerminal = true

      return project.close()
      .then(() => {
        expectNotCalledWith(vi.mocked(runEvents.execute), 'after:run')
      })
    })

    it('does not execute after:run if experimental flag is not enabled', () => {
      projectConfig.experimentalInteractiveRunEvents = false
      projectConfig.isTextTerminal = false

      return project.close()
      .then(() => {
        expectNotCalledWith(vi.mocked(runEvents.execute), 'after:run')
      })
    })
  })

  describe('#reset', () => {
    let project

    beforeEach(() => {
      project = new ProjectBase({ projectRoot: pristinePath, testingType: 'e2e' })
      project._automation = { reset: vi.fn() }
      project._server = { close () {}, reset: vi.fn() }
    })

    it('resets server + automation', () => {
      project._cfg = {}

      project.ctx.coreData.studioLifecycleManager = {
        isStudioReady: vi.fn().mockReturnValue(true),
        getStudio: vi.fn().mockResolvedValue({
          isProtocolEnabled: false,
        }),
      }

      let protocolManagerValue

      stubAccessor(project, 'protocolManager', () => protocolManagerValue, (val) => {
        protocolManagerValue = val
      })

      project.reset()
      expect(project._automation.reset).toHaveBeenCalledOnce()
      expect(project.server.reset).toHaveBeenCalledOnce()
    })

    it('resets server + automation with studio protocol enabled', () => {
      // Set up minimal test structure
      project._cfg = {}
      project._protocolManager = { close: vi.fn() }

      const studioLifecycleManager = new StudioLifecycleManager()

      project.ctx.coreData.studioLifecycleManager = studioLifecycleManager

      const studio = { isProtocolEnabled: true }

      studioLifecycleManager.isStudioReady = vi.fn().mockReturnValue(true)
      vi.spyOn(studioLifecycleManager, 'getStudio').mockResolvedValue(studio)

      let protocolManagerValue = project._protocolManager

      stubAccessor(project, 'protocolManager', () => protocolManagerValue, (val) => {
        protocolManagerValue = val
      })

      // Call reset
      project.reset()

      // Verify expected behaviors
      expect(project._automation.reset).toHaveBeenCalledOnce()
      expect(project.server.reset).toHaveBeenCalledOnce()
    })
  })

  describe('#startWebsockets', () => {
    let project

    beforeEach(() => {
      project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })
      project.watchers = {}
      project._server = { close () {}, startWebsockets: vi.fn(), setProtocolManager: vi.fn() }
      vi.spyOn(ProjectBase.prototype, 'open').mockResolvedValue(undefined)
    })

    it('calls server.startWebsockets with automation + config', async () => {
      const c = {}

      project.__setConfig(c)
      project.startWebsockets({}, c)

      const args = project.server.startWebsockets.mock.lastCall

      expect(args[0]).toBeInstanceOf(Automation)
      expect(args[1]).toBe(c)
    })

    it('passes onReloadBrowser callback', () => {
      const fn = vi.fn()

      // sinon yieldsTo: invoke onReloadBrowser on the first argument that has it
      project.server.startWebsockets.mockImplementation((...args) => {
        const target = args.find((arg) => typeof arg?.onReloadBrowser === 'function')

        if (!target) {
          throw new Error('startWebsockets expected to yield to onReloadBrowser, but no object with such a property was passed')
        }

        target.onReloadBrowser()
      })

      project.startWebsockets({ onReloadBrowser: fn }, {})

      expect(fn).toHaveBeenCalledOnce()
    })

    describe('studio', () => {
      let markStub
      let reportTelemetryStub

      beforeEach(() => {
        markStub = vi.fn()
        reportTelemetryStub = vi.fn()

        telemetryManager.mark = markStub
        TelemetryReporter.getInstance = vi.fn().mockReturnValue({
          reportTelemetry: reportTelemetryStub,
        })
      })

      it('passes onStudioInit callback with AI enabled and a protocol manager', async () => {
        const mockSetupProtocol = vi.fn()
        const mockBeforeSpec = vi.fn()
        const mockAccessStudioAI = vi.fn().mockResolvedValue(true)
        const mockCaptureStudioEvent = vi.fn().mockResolvedValue(undefined)
        const mockUpdateSessionId = vi.fn()

        project.spec = {}

        project._cfg = project._cfg || {}
        project._cfg.projectId = 'test-project-id'
        project.ctx.coreData.user = { email: 'test@example.com' }
        project.ctx.coreData.machineId = Promise.resolve('test-machine-id')

        const studioManager = new StudioManager()

        studioManager.canAccessStudioAI = mockAccessStudioAI
        studioManager.captureStudioEvent = mockCaptureStudioEvent
        studioManager.protocolManager = {
          setupProtocol: mockSetupProtocol,
          beforeSpec: mockBeforeSpec,
          db: { test: 'db' },
          dbPath: 'test-db-path',
        }

        studioManager.updateSessionId = mockUpdateSessionId

        const studioLifecycleManager = new StudioLifecycleManager()

        project.ctx.coreData.studioLifecycleManager = studioLifecycleManager

        // Set up the studio manager promise directly
        studioLifecycleManager.studioManagerPromise = Promise.resolve(studioManager)
        studioLifecycleManager.isStudioReady = vi.fn().mockReturnValue(true)

        // Create a browser object
        project.browser = {
          name: 'chrome',
          family: 'chromium',
        }

        project.options = { browsers: [project.browser] }

        vi.spyOn(browsers, 'closeProtocolConnection').mockResolvedValue(undefined)

        vi.spyOn(browsers, 'connectProtocolToBrowser').mockResolvedValue(undefined)
        vi.spyOn(browsers, 'connectStudioToBrowser').mockResolvedValue(undefined)
        stubAccessor(project, 'protocolManager', () => {
          return project['_protocolManager']
        }, (protocolManager) => {
          project['_protocolManager'] = protocolManager
        })

        vi.spyOn(project, 'resetBrowserState').mockResolvedValue(undefined)

        let studioInitPromise

        project.server.startWebsockets.mockImplementation(async (automation, config, callbacks) => {
          studioInitPromise = callbacks.onStudioInit()
        })

        project.startWebsockets({}, {})

        const { canAccessStudioAI } = await studioInitPromise

        expect(canAccessStudioAI).toBe(true)

        expect(mockSetupProtocol).toHaveBeenCalledOnce()
        expect(mockBeforeSpec).toHaveBeenCalledOnce()
        expectCalledWith(mockAccessStudioAI, {
          family: 'chromium',
          name: 'chrome',
        })

        expect(mockUpdateSessionId.mock.calls[0][0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)

        expectCalledWith(browsers.connectProtocolToBrowser, {
          browser: project.browser,
          foundBrowsers: project.options.browsers,
          protocolManager: studioManager.protocolManager,
        })

        expectCalledWith(browsers.connectStudioToBrowser, {
          browser: project.browser,
          foundBrowsers: project.options.browsers,
          studioManager: studioManager,
        })

        expect(project['_protocolManager']).toBe(studioManager.protocolManager)

        expectCalledWith(markStub, MARK_NAMES.INITIALIZATION_START)
        expectCalledWith(markStub, MARK_NAMES.INITIALIZATION_END)
        expectCalledWith(markStub, MARK_NAMES.CAN_ACCESS_STUDIO_AI_START)
        expectCalledWith(markStub, MARK_NAMES.CAN_ACCESS_STUDIO_AI_END)
        expectCalledWith(markStub, MARK_NAMES.CONNECT_PROTOCOL_TO_BROWSER_START)
        expectCalledWith(markStub, MARK_NAMES.CONNECT_PROTOCOL_TO_BROWSER_END)
        expectCalledWith(markStub, MARK_NAMES.CONNECT_STUDIO_TO_BROWSER_START)
        expectCalledWith(markStub, MARK_NAMES.CONNECT_STUDIO_TO_BROWSER_END)
        expectCalledWith(markStub, MARK_NAMES.INITIALIZE_STUDIO_AI_START)
        expectCalledWith(markStub, MARK_NAMES.INITIALIZE_STUDIO_AI_END)
        expectCalledWith(reportTelemetryStub, TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO, {
          status: 'success',
          canAccessStudioAI: true,
        })
      })

      it('onStudioInit uses existing session ID if provided', async () => {
        const mockSetupProtocol = vi.fn()
        const mockBeforeSpec = vi.fn()
        const mockAccessStudioAI = vi.fn().mockResolvedValue(true)
        const mockCaptureStudioEvent = vi.fn().mockResolvedValue(undefined)
        const mockUpdateSessionId = vi.fn()

        project.spec = {}

        project._cfg = project._cfg || {}
        project._cfg.projectId = 'test-project-id'
        project.ctx.coreData.user = { email: 'test@example.com' }
        project.ctx.coreData.machineId = Promise.resolve('test-machine-id')

        const studioManager = new StudioManager()

        studioManager.canAccessStudioAI = mockAccessStudioAI
        studioManager.captureStudioEvent = mockCaptureStudioEvent
        studioManager.protocolManager = {
          setupProtocol: mockSetupProtocol,
          beforeSpec: mockBeforeSpec,
          db: { test: 'db' },
          dbPath: 'test-db-path',
        }

        studioManager.updateSessionId = mockUpdateSessionId

        const studioLifecycleManager = new StudioLifecycleManager()

        project.ctx.coreData.studioLifecycleManager = studioLifecycleManager

        // Set up the studio manager promise directly
        studioLifecycleManager.studioManagerPromise = Promise.resolve(studioManager)
        studioLifecycleManager.isStudioReady = vi.fn().mockReturnValue(true)

        // Create a browser object
        project.browser = {
          name: 'chrome',
          family: 'chromium',
        }

        project.options = { browsers: [project.browser] }

        vi.spyOn(browsers, 'closeProtocolConnection').mockResolvedValue(undefined)

        vi.spyOn(browsers, 'connectProtocolToBrowser').mockResolvedValue(undefined)
        vi.spyOn(browsers, 'connectStudioToBrowser').mockResolvedValue(undefined)
        stubAccessor(project, 'protocolManager', () => {
          return project['_protocolManager']
        }, (protocolManager) => {
          project['_protocolManager'] = protocolManager
        })

        vi.spyOn(project, 'resetBrowserState').mockResolvedValue(undefined)

        let studioInitPromise

        project.server.startWebsockets.mockImplementation(async (automation, config, callbacks) => {
          studioInitPromise = callbacks.onStudioInit({ sessionId: 'existing-session-id' })
        })

        project.startWebsockets({}, {})

        const { cloudStudioSessionId } = await studioInitPromise

        expect(cloudStudioSessionId).toBe('existing-session-id')
        expect(mockUpdateSessionId).toHaveBeenCalledOnce()
        expectCalledWith(mockUpdateSessionId, 'existing-session-id')
      })

      it('calls resetBrowserState during onStudioInit when AI is enabled', async () => {
        const mockSetupProtocol = vi.fn()
        const mockBeforeSpec = vi.fn()
        const mockAccessStudioAI = vi.fn().mockResolvedValue(true)
        const mockCaptureStudioEvent = vi.fn().mockResolvedValue(undefined)

        project.spec = {}

        project._cfg = project._cfg || {}
        project._cfg.projectId = 'test-project-id'
        project.ctx.coreData.user = { email: 'test@example.com' }
        project.ctx.coreData.machineId = Promise.resolve('test-machine-id')

        const studioManager = new StudioManager()

        studioManager.canAccessStudioAI = mockAccessStudioAI
        studioManager.captureStudioEvent = mockCaptureStudioEvent
        studioManager.protocolManager = {
          setupProtocol: mockSetupProtocol,
          beforeSpec: mockBeforeSpec,
          dbPath: 'test-db-path',
        }

        const resetStub = vi.spyOn(project, 'resetBrowserState').mockResolvedValue(undefined)

        const studioLifecycleManager = new StudioLifecycleManager()

        project.ctx.coreData.studioLifecycleManager = studioLifecycleManager

        // Set up the studio manager promise directly
        studioLifecycleManager.studioManagerPromise = Promise.resolve(studioManager)
        studioLifecycleManager.isStudioReady = vi.fn().mockReturnValue(true)

        // Create a browser object
        project.browser = {
          name: 'chrome',
          family: 'chromium',
        }

        project.options = { browsers: [project.browser] }

        vi.spyOn(browsers, 'closeProtocolConnection').mockResolvedValue(undefined)
        vi.spyOn(browsers, 'connectProtocolToBrowser').mockResolvedValue(undefined)
        vi.spyOn(browsers, 'connectStudioToBrowser').mockResolvedValue(undefined)
        stubAccessor(project, 'protocolManager', () => {
          return project['_protocolManager']
        }, (protocolManager) => {
          project['_protocolManager'] = protocolManager
        })

        let studioInitPromise

        project.server.startWebsockets.mockImplementation(async (automation, config, callbacks) => {
          studioInitPromise = callbacks.onStudioInit()
        })

        project.startWebsockets({}, {})

        await studioInitPromise

        expect(resetStub).toHaveBeenCalledOnce()
      })

      it('passes onStudioInit callback with AI enabled but no protocol manager', async () => {
        const mockSetupProtocol = vi.fn()
        const mockBeforeSpec = vi.fn()
        const mockAccessStudioAI = vi.fn().mockResolvedValue(true)
        const mockCaptureStudioEvent = vi.fn().mockResolvedValue(undefined)

        project.spec = {}

        project._cfg = project._cfg || {}
        project._cfg.projectId = 'test-project-id'
        project.ctx.coreData.user = { email: 'test@example.com' }
        project.ctx.coreData.machineId = Promise.resolve('test-machine-id')

        const studioManager = new StudioManager()

        studioManager.canAccessStudioAI = mockAccessStudioAI
        studioManager.captureStudioEvent = mockCaptureStudioEvent
        const studioLifecycleManager = new StudioLifecycleManager()

        project.ctx.coreData.studioLifecycleManager = studioLifecycleManager

        studioLifecycleManager.studioManagerPromise = Promise.resolve(studioManager)

        studioLifecycleManager.isStudioReady = vi.fn().mockReturnValue(true)

        // Create a browser object
        project.browser = {
          name: 'chrome',
          family: 'chromium',
        }

        project.options = { browsers: [project.browser] }

        vi.spyOn(browsers, 'closeProtocolConnection').mockResolvedValue(undefined)

        vi.spyOn(browsers, 'connectProtocolToBrowser').mockResolvedValue(undefined)
        vi.spyOn(browsers, 'connectStudioToBrowser').mockResolvedValue(undefined)
        stubAccessor(project, 'protocolManager', () => {
          return project['_protocolManager']
        }, (protocolManager) => {
          project['_protocolManager'] = protocolManager
        })

        let studioInitPromise

        project.server.startWebsockets.mockImplementation(async (automation, config, callbacks) => {
          studioInitPromise = callbacks.onStudioInit()
        })

        project.startWebsockets({}, {})

        const { canAccessStudioAI } = await studioInitPromise

        expect(canAccessStudioAI).toBe(false)

        expect(mockSetupProtocol).not.toHaveBeenCalled()
        expect(mockBeforeSpec).not.toHaveBeenCalled()
        expect(mockAccessStudioAI).not.toHaveBeenCalled()

        expect(browsers.connectProtocolToBrowser).not.toHaveBeenCalled()
        expect(project['_protocolManager']).toBeUndefined()

        expectCalledWith(markStub, MARK_NAMES.INITIALIZATION_START)
        expectCalledWith(markStub, MARK_NAMES.INITIALIZATION_END)
        expectNotCalledWith(markStub, MARK_NAMES.CAN_ACCESS_STUDIO_AI_START)
        expectNotCalledWith(markStub, MARK_NAMES.CAN_ACCESS_STUDIO_AI_END)
        expectNotCalledWith(markStub, MARK_NAMES.CONNECT_PROTOCOL_TO_BROWSER_START)
        expectNotCalledWith(markStub, MARK_NAMES.CONNECT_PROTOCOL_TO_BROWSER_END)
        expectNotCalledWith(markStub, MARK_NAMES.INITIALIZE_STUDIO_AI_START)
        expectNotCalledWith(markStub, MARK_NAMES.INITIALIZE_STUDIO_AI_END)
        expectCalledWith(reportTelemetryStub, TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO, {
          status: 'success',
          canAccessStudioAI: false,
        })
      })

      it('passes onStudioInit callback with AI disabled', async () => {
        const mockSetupProtocol = vi.fn()
        const mockBeforeSpec = vi.fn()
        const mockAccessStudioAI = vi.fn().mockResolvedValue(false)
        const mockCaptureStudioEvent = vi.fn().mockResolvedValue(undefined)

        project.spec = {}

        project._cfg = project._cfg || {}
        project._cfg.projectId = 'test-project-id'
        project.ctx.coreData.user = { email: 'test@example.com' }
        project.ctx.coreData.machineId = Promise.resolve('test-machine-id')

        const studioManager = new StudioManager()

        studioManager.canAccessStudioAI = mockAccessStudioAI
        studioManager.captureStudioEvent = mockCaptureStudioEvent
        studioManager.protocolManager = {
          setupProtocol: mockSetupProtocol,
          beforeSpec: mockBeforeSpec,
        }

        const studioLifecycleManager = new StudioLifecycleManager()

        project.ctx.coreData.studioLifecycleManager = studioLifecycleManager

        studioLifecycleManager.studioManagerPromise = Promise.resolve(studioManager)

        studioLifecycleManager.isStudioReady = vi.fn().mockReturnValue(true)

        project.browser = {
          name: 'chrome',
          family: 'chromium',
        }

        project.options = { browsers: [project.browser] }

        vi.spyOn(browsers, 'closeProtocolConnection').mockResolvedValue(undefined)

        vi.spyOn(browsers, 'connectProtocolToBrowser').mockResolvedValue(undefined)
        vi.spyOn(browsers, 'connectStudioToBrowser').mockResolvedValue(undefined)
        stubAccessor(project, 'protocolManager', () => {
          return project['_protocolManager']
        }, (protocolManager) => {
          project['_protocolManager'] = protocolManager
        })

        let studioInitPromise

        project.server.startWebsockets.mockImplementation(async (automation, config, callbacks) => {
          studioInitPromise = callbacks.onStudioInit()
        })

        project.startWebsockets({}, {})

        const { canAccessStudioAI } = await studioInitPromise

        expect(canAccessStudioAI).toBe(false)

        expect(mockSetupProtocol).not.toHaveBeenCalled()
        expect(mockBeforeSpec).not.toHaveBeenCalled()
        expect(browsers.connectProtocolToBrowser).not.toHaveBeenCalled()
        expect(browsers.connectStudioToBrowser).not.toHaveBeenCalled()
        expect(project['_protocolManager']).toBeUndefined()

        expectCalledWith(markStub, MARK_NAMES.INITIALIZATION_START)
        expectCalledWith(markStub, MARK_NAMES.INITIALIZATION_END)
        expectCalledWith(markStub, MARK_NAMES.CAN_ACCESS_STUDIO_AI_START)
        expectCalledWith(markStub, MARK_NAMES.CAN_ACCESS_STUDIO_AI_END)
        expectNotCalledWith(markStub, MARK_NAMES.CONNECT_PROTOCOL_TO_BROWSER_START)
        expectNotCalledWith(markStub, MARK_NAMES.CONNECT_PROTOCOL_TO_BROWSER_END)
        expectNotCalledWith(markStub, MARK_NAMES.CONNECT_STUDIO_TO_BROWSER_START)
        expectNotCalledWith(markStub, MARK_NAMES.CONNECT_STUDIO_TO_BROWSER_END)
        expectNotCalledWith(markStub, MARK_NAMES.INITIALIZE_STUDIO_AI_START)
        expectNotCalledWith(markStub, MARK_NAMES.INITIALIZE_STUDIO_AI_END)
        expectCalledWith(reportTelemetryStub, TELEMETRY_GROUP_NAMES.INITIALIZE_STUDIO, {
          status: 'success',
          canAccessStudioAI: false,
        })
      })

      it('onStudioDestroy destroys studio when it is initialized', async () => {
        project._isStudioInitialized = true

        // Create a studio manager with minimal properties
        const protocolManager = { close: vi.fn().mockResolvedValue(undefined) }
        const studioManager = {
          destroy: vi.fn().mockResolvedValue(undefined),
          protocolManager,
        }

        project.ctx.coreData.studioLifecycleManager = {
          getStudio: vi.fn().mockResolvedValue(studioManager),
          isStudioReady: vi.fn().mockResolvedValue(true),
        }

        project['_protocolManager'] = protocolManager

        // Create a browser object
        project.browser = {
          name: 'chrome',
          family: 'chromium',
        }

        project.options = { browsers: [project.browser] }

        vi.spyOn(browsers, 'closeProtocolConnection').mockResolvedValue(undefined)

        // Modify the startWebsockets stub to track the callbacks
        const callbackPromise = new Promise<void>((resolve) => {
          project.server.startWebsockets.mockImplementation(async (automation, config, callbacks) => {
            await callbacks.onStudioDestroy()
            resolve()
          })
        })

        project.startWebsockets({}, {})

        await callbackPromise

        expect(studioManager.destroy).toHaveBeenCalledOnce()
        expect(browsers.closeProtocolConnection).toHaveBeenCalledOnce()
        expect(protocolManager.close).toHaveBeenCalledOnce()
        expect(project['_protocolManager']).toBeUndefined()
      })

      it('onStudioDestroy does not destroy studio when it is not initialized', async () => {
        const protocolManager = { close: vi.fn().mockResolvedValue(undefined) }
        const studioManager = {
          destroy: vi.fn().mockResolvedValue(undefined),
          protocolManager,
        }

        project.ctx.coreData.studioLifecycleManager = {
          getStudio: vi.fn().mockResolvedValue(studioManager),
          isStudioReady: vi.fn().mockResolvedValue(true),
        }

        project['_protocolManager'] = protocolManager

        // Create a browser object
        project.browser = {
          name: 'chrome',
          family: 'chromium',
        }

        project.options = { browsers: [project.browser] }

        vi.spyOn(browsers, 'closeProtocolConnection').mockResolvedValue(undefined)

        // Modify the startWebsockets stub to track the callbacks
        const callbackPromise = new Promise<void>((resolve) => {
          project.server.startWebsockets.mockImplementation(async (automation, config, callbacks) => {
            await callbacks.onStudioDestroy()
            resolve()
          })
        })

        project.startWebsockets({}, {})

        await callbackPromise

        expect(studioManager.destroy).not.toHaveBeenCalled()
        expect(browsers.closeProtocolConnection).not.toHaveBeenCalled()
        expect(protocolManager.close).not.toHaveBeenCalled()
      })
    })

    it('passes onCyPromptReady callback', async () => {
      const mockCyPromptManager = {
        foo: 'bar',
      }

      // Create a browser object
      project.browser = {
        name: 'chrome',
        family: 'chromium',
      }

      project.options = { browsers: [project.browser] }

      vi.spyOn(browsers, 'connectCyPromptToBrowser').mockImplementation(() => undefined)

      // Modify the startWebsockets stub to track the callbacks
      const callbackPromise = new Promise<void>((resolve) => {
        project.server.startWebsockets.mockImplementation(async (automation, config, callbacks) => {
          await callbacks.onCyPromptReady(mockCyPromptManager)
          resolve()
        })
      })

      project.startWebsockets({}, {})

      await callbackPromise

      expectCalledWith(browsers.connectCyPromptToBrowser, {
        browser: project.browser,
        foundBrowsers: project.options.browsers,
        cyPromptManager: mockCyPromptManager,
      })
    })
  })

  describe('#getProjectId', () => {
    let project

    beforeEach(() => {
      project = new ProjectBase({ projectRoot: '/_test-output/path/to/project-e2e', testingType: 'e2e' })
      vi.spyOn(ctx.lifecycleManager, 'getProjectId').mockResolvedValue('id-123')
    })

    it('returns the project id from data-context', () => {
      return project.getProjectId()
      .then((id) => {
        expect(ctx.lifecycleManager.getProjectId).toHaveBeenCalledOnce()
        expect(id).toBe('id-123')
      })
    })
  })
})

describe('lib/project-base #isRunnerSocketConnected', () => {
  it('calls through to socket method', () => {
    const isRunnerSocketConnected = vi.fn().mockReturnValue(true)

    const project: any = new ProjectBase({ projectRoot: Fixtures.projectPath('todos'), testingType: 'e2e' })

    project._server = {
      socket: {
        isRunnerSocketConnected,
      },
    }

    const result = project.isRunnerSocketConnected()

    expect(result).toBe(true)
    expect(isRunnerSocketConnected).toHaveBeenCalledOnce()
  })
})
