import { objectType } from 'nexus'
import { BaseError } from '.'
import { App } from './gql-App'
import { DevState } from './gql-DevState'
import { NavigationMenu } from './gql-NavigationMenu'
import { Wizard } from './gql-Wizard'

export const Query = objectType({
  name: 'Query',
  description: 'The root "Query" type containing all entry fields for our querying',
  definition (t) {
    t.field('baseError', {
      type: BaseError,
      resolve: (root, args, ctx) => ctx.baseError,
    })

    t.nonNull.field('app', {
      type: App,
      resolve: (root, args, ctx) => ctx.appData,
    })

    t.field('navigationMenu', {
      type: NavigationMenu,
      description: 'Metadata about the nagivation menu',
    })

    t.nonNull.field('wizard', {
      type: Wizard,
      description: 'Metadata about the wizard, null if we arent showing the wizard',
      resolve: (root, args, ctx) => ctx.coreData.wizard,
    })

    t.nonNull.field('dev', {
      type: DevState,
      description: 'The state of any info related to local development of the runner',
      resolve: (root, args, ctx) => ctx.coreData.dev,
    })

    t.string('browserErrorMessage', {
      description: 'An error related to finding a browser',
      resolve: (source, args, ctx) => {
        return ctx.wizardData.browserErrorMessage
      },
    })
  },
})
