import { WizardBundler } from './gql-WizardBundler'
import { FrontendFrameworkEnum, SupportStatusEnum } from '../enumTypes/gql-WizardEnums'
import { objectType } from 'nexus'

export const WizardFrontendFramework = objectType({
  name: 'WizardFrontendFramework',
  description: 'A frontend framework that we can setup within the app',
  node: 'type',
  definition (t) {
    t.nonNull.field('type', {
      type: FrontendFrameworkEnum,
      description: 'The unique identifier for a framework or library',
    }),

    t.nonNull.field('category', {
      type: 'String',
      description: 'The category (framework, like react-scripts, or library, like react',
    }),

    t.nonNull.boolean('isSelected', {
      description: 'Whether this is the selected framework in the wizard',
      resolve: (source, args, ctx) => ctx.wizardData.chosenFramework?.type === source.type,
    })

    t.nonNull.boolean('isDetected', {
      description: 'Whether this is the detected framework',
      resolve: (source, args, ctx) => ctx.wizardData.detectedFramework?.type === source.type,
    })

    t.nonNull.string('name', {
      description: 'The display name of the framework',
    })

    t.field('supportStatus', {
      description: 'Current support status of the framework',
      type: SupportStatusEnum,
    })

    t.nonNull.list.nonNull.field('supportedBundlers', {
      type: WizardBundler,
      description: 'All of the supported bundlers for this framework',
      resolve: (source, args, ctx) => {
        return [...source.supportedBundlers]
      },
    })
  },

  sourceType: {
    module: '@packages/scaffold-config',
    export: 'WizardFrontendFramework',
  },
})
