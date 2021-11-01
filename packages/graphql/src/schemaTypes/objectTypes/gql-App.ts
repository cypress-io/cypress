import { objectType } from 'nexus'
import { Project } from './gql-Project'
import { Browser } from './gql-Browser'

export const App = objectType({
  name: 'App',
  description: 'Namespace for information related to the app',
  definition (t) {
    t.field('activeProject', {
      type: Project,
      description: 'Active project',
    })

    t.field('selectedBrowser', {
      type: Browser,
      description: 'The currently selected browser for the application',
      resolve: (source, args, ctx) => {
        return ctx.wizardData.chosenBrowser
      },
    })

    t.string('browserErrorMessage', {
      description: 'An error related to finding a browser',
      resolve: (source, args, ctx) => {
        return ctx.wizardData.browserErrorMessage
      },
    })

    t.nonNull.boolean('isRefreshingBrowsers', {
      description: 'Whether we are currently refreshing the browsers list',
      resolve: (source) => Boolean(source.refreshingBrowsers),
    })

    t.list.nonNull.field('browsers', {
      type: Browser,
      description: 'Browsers found that are compatible with Cypress',
    })

    t.nonNull.string('healthCheck', {
      description: 'See if the GraphQL server is alive',
      resolve: () => 'OK',
    })

    t.field('activeTestingType', {
      description: 'The mode the interactive runner was launched in',
      type: 'TestingTypeEnum',
    })

    t.nonNull.boolean('isInGlobalMode', {
      description: 'Whether the app is in global mode or not',
      resolve: (source, args, ctx) => {
        return ctx.app.isGlobalMode
      },
    })

    t.nonNull.boolean('isAuthBrowserOpened', {
      description: 'Whether the browser has been opened for auth or not',
    })

    t.nonNull.list.nonNull.field('projects', {
      type: Project,
      description: 'All known projects for the app',
    })
  },
  sourceType: {
    module: '@packages/data-context/src/data/coreDataShape',
    export: 'AppDataShape',
  },
})
