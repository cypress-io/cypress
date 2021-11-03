import { expect } from 'chai'
import { DataContext } from '@packages/data-context'
import sinon from 'sinon'
import snapshot from 'snap-shot-it'
import sinonChai from '@cypress/sinon-chai'
import chai from 'chai'

chai.use(sinonChai)

interface DataContextOverrides {
  projectPreferencesFromCache: Record<string, any>
}

const chromeTestPath = '/dev/chrome'

const makeDataContext = (options) => {
  return new DataContext({
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

    it('skips first wizard step when given a testingType', async () => {
      const context = makeDataContext({
        launchArgs: {
          testingType: 'e2e',
        },
      })

      await context.initializeData()
      expect(context.coreData.wizard).to.contain({
        chosenTestingType: 'e2e',
        currentStep: 'initializePlugins',
      })
    })

    it.only('launches without electron if preferences is set', async () => {
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

      const res = await context.initializeData()

      // expect(stub).to.have.been.calledWith({})

      // console.log(res)
    })
  })
})
