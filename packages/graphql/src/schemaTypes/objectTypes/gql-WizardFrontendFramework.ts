import { WizardBundler } from './gql-WizardBundler'
import { objectType } from 'nexus'
import { FrontendFrameworkEnum } from '../enumTypes/gql-WizardEnums'

export const WizardFrontendFramework = objectType({
  name: 'WizardFrontendFramework',
  description: 'A frontend framework that we can setup within the app',
  node: 'type',
  definition (t) {
    t.nonNull.field('type', {
      type: FrontendFrameworkEnum,
      description: 'The name of the framework',
    })

    t.nonNull.boolean('isSelected', {
      description: 'Whether this is the selected framework in the wizard',
      resolve: (source, args, ctx) => false,
    })

    t.nonNull.string('name', {
      description: 'The name of the framework',
    })

    t.nonNull.list.nonNull.field('supportedBundlers', {
      type: WizardBundler,
      description: 'All of the supported bundlers for this framework',
      resolve: (source, args, ctx) => {
        return []
      },
    })
  },
  sourceType: {
    module: '@packages/types',
    export: 'FrontendFramework',
  },
})
