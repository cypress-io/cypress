import { WizardBundler } from './gql-WizardBundler'
import { objectType } from 'nexus'
import { WIZARD_BUNDLERS } from '@packages/scaffold-config'

export const WizardFrontendFramework = objectType({
  name: 'WizardFrontendFramework',
  description: 'A frontend framework that we can setup within the app',
  node: 'type',
  definition (t) {
    t.nonNull.string('type', {
      description: 'The unique identifier for a framework or library',
    }),

    t.nonNull.string('category', {
      description: 'The category (framework, like react-scripts, or library, like react',
    }),

    t.nonNull.string('name', {
      description: 'The display name of the framework',
    })

    t.nonNull.string('supportStatus', {
      description: 'Current support status of the framework',
    })

    t.nonNull.boolean('isSelected', {
      description: 'Whether this is the selected framework in the wizard',
      resolve: (source, args, ctx) => ctx.wizardData.chosenFramework?.type === source.type,
    })

    t.nonNull.boolean('isDetected', {
      description: 'Whether this is the detected framework',
      resolve: (source, args, ctx) => ctx.wizardData.detectedFramework?.type === source.type,
    })

    t.nonNull.list.nonNull.field('supportedBundlers', {
      type: WizardBundler,
      description: 'All of the supported bundlers for this framework',
      resolve: (source, args, ctx) => {
        const findBundler = (type: 'webpack' | 'vite') => {
          const b = WIZARD_BUNDLERS.find((b) => b.type === type)

          if (!b) {
            throw Error(`Invalid bundler: ${type}`)
          }

          return b
        }

        return ctx.wizardData.chosenFramework?.supportedBundlers.map(findBundler) ?? []
      },
    })
  },
})
