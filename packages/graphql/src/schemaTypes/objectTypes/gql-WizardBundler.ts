import { objectType } from 'nexus'
import { SupportedBundlerEnum } from '../enumTypes'

export const WizardBundler = objectType({
  name: 'WizardBundler',
  description: 'Wizard bundler',
  node: 'package',
  definition (t) {
    t.boolean('isSelected', {
      description: 'Whether this is the selected framework bundler',
      resolve: (source, args, ctx) => ctx.wizardData.chosenBundler === source.type,
    })

    t.nonNull.boolean('isDetected', {
      description: 'Whether this is the detected bundler',
      resolve: (source, args, ctx) => ctx.wizardData.detectedBundler === source.type,
    })

    t.nonNull.field('type', {
      type: SupportedBundlerEnum,
      description: 'The name of the framework',
    })

    t.nonNull.field('package', {
      type: SupportedBundlerEnum,
      description: 'Name of package on npm',
    })

    t.nonNull.string('name', {
      description: 'Display name of the bundler',
    })
  },
})
