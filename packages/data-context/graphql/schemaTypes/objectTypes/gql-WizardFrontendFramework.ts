import { objectType } from 'nexus'
import { WIZARD_BUNDLERS } from '@packages/scaffold-config'
import { SupportStatusEnum } from '../enumTypes'
import { WizardBundler } from './gql-WizardBundler'

export const WizardFrontendFramework = objectType({
  name: 'WizardFrontendFramework',
  description: 'A frontend framework that we can setup within the app',
  node: 'type',
  definition (t) {
    t.nonNull.string('type', {
      description: 'The unique identifier for a framework or library',
    }),

    t.nonNull.string('category', {
      description: 'The category (framework, like next.js, or library, like react',
    }),

    t.nonNull.string('name', {
      description: 'The display name of the framework',
    })

    t.nonNull.field('supportStatus', {
      description: 'Current support status of the framework',
      type: SupportStatusEnum,
    })

    t.nonNull.boolean('isSelected', {
      description: 'Whether this is the selected framework in the wizard',
      resolve: (source, args, ctx) => ctx.coreData.wizard.chosenFramework?.type === source.type,
    })

    t.nonNull.boolean('isDetected', {
      description: 'Whether this is the detected framework',
      resolve: (source, args, ctx) => ctx.coreData.wizard.detectedFramework?.type === source.type,
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

        return ctx.coreData.wizard.chosenFramework?.supportedBundlers.map(findBundler) ?? []
      },
    })

    t.string('icon', {
      description: 'Raw SVG icon of framework',
    })
  },
})
