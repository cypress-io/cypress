import { expect } from 'chai'
import sinon from 'sinon'
import { DataContext } from '@packages/data-context'
import snapshot from 'snap-shot-it'
import sinonChai from '@cypress/sinon-chai'
import chai from 'chai'

chai.use(sinonChai)

const chromeTestPath = '/dev/chrome'

const makeDataContext = (options) => {
  return new DataContext({
    electronApp: {
      dock: {
        hide: () => {},
        show: () => {},
      }
    },
    launchOptions: {},
    launchArgs: {},
    appApi: {
      getBrowsers: () => [{
        path: chromeTestPath
      }],
    },
    authApi: {
      getUser: () => Promise.resolve({}),
    },
    projectApi: {
      initializeProject: () => {},
      launchProject: () => {},
      getProjectRootsFromCache: () => ([]),
      getProjectPreferencesFromCache: () => {
        return {
          [options.coreData.app.activeProject.title]: {
            browserPath: chromeTestPath,
            testingType: 'component'
          }
        }
      },
      closeActiveProject: () => {},
      getConfig: () => {}
    },
    ...options,
  })
}

describe('@packages/data-context', () => {
  describe('initializeData', () => {
    it('initializes', async () => {
      const context = makeDataContext({})

      await context.initializeData()
      snapshot(context)
    })

    it.only('skips first wizard step when given a testingType', async () => {
      const context = makeDataContext({
        launchArgs: {
          projectRoot: '/project/root',
          testingType: 'e2e',
        },
      })

      await context.initializeData()
      expect(context.coreData.wizard).to.contain({
        chosenTestingType: 'e2e',
        currentStep: 'initializePlugins',
      })
    })

    it('launches without electron if preferences is set', async () => {
      const projectRoot = '/project/root'
      const activeProject = {
        title: 'active-project',
        ctPluginsInitialized: false,
        e2ePluginsInitialized: false,
        isCTConfigured: true,
        isE2EConfigured: false,
        config: null,
        configChildProcess: null, 
        generatedSpec: null, 
        projectRoot,
        preferences: {
          browserPath: '/some/browser/path',
          testingType: 'component'
        }
      }

      const context = makeDataContext({
        launchArgs: {
          testingType: 'e2e',
          projectRoot
        },
        coreData: {
          wizard: {
            history: []
          },
          app: {
            projects: [activeProject],
            activeProject,
          },
          electron: {}
        }
      })

      const spy = sinon.spy(context._apis.projectApi, 'launchProject')
      await context.initializeData()
      expect(spy).to.have.been.called
    })
  })
})
