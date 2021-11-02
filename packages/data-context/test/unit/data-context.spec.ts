import { expect } from 'chai'
import { DataContext } from '@packages/data-context'
import snapshot from 'snap-shot-it'

const makeDataContext = (options) => {
  return new DataContext({
    launchOptions: {},
    launchArgs: {},
    appApi: {
      getBrowsers: () => ({}),
    },
    authApi: {
      getUser: () => Promise.resolve({}),
    },
    projectApi: {
      getProjectRootsFromCache: () => ([]),
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
      expect(context._coreData.wizard).to.contain({
        chosenTestingType: 'e2e',
        currentStep: 'initializePlugins',
      })
    })
  })
})
