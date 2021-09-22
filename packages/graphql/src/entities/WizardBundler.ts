import { objectType } from 'nexus'
import { BundlerDisplayNames, BundlerPackageNames } from '../constants'

export const WizardBundler = objectType({
  name: 'WizardBundler',
  description: 'Wizard bundler',
  node: (source) => source,
  definition (t) {
    t.boolean('isSelected', {
      description: 'Whether this is the selected framework bundler',
      resolve: (source, args, ctx) => ctx.wizard.chosenBundler === source,
    })

    t.nonNull.string('name', {
      resolve: (source) => BundlerDisplayNames[source],
    })

    t.nonNull.string('package', {
      resolve: (source) => BundlerPackageNames[source],
    })
  },
  sourceType: {
    module: '@packages/graphql/src/constants',
    export: 'Bundler',
  },
})

// @nxs.objectType({
//   description: 'Wizard bundler',
// })
// export class WizardBundler {
//   constructor (private wizard: Wizard, private bundler: Bundler) {}
//   @nxs.field.nonNull.type(() => BundlerEnum)
//   get id (): NxsResult<'WizardBundler', 'id'> {
//     return this.bundler
//   }
//   @nxs.field.nonNull.string()
//   get name (): NxsResult<'WizardBundler', 'name'> {
//     return BundlerDisplayNames[this.bundler]
//   }
//   @nxs.field.nonNull.string()
//   get package (): NxsResult<'WizardBundler', 'package'> {
//     return BundlerPackageNames[this.bundler]
//   }
//   @nxs.field.boolean({
//     description: 'Whether this is the selected framework bundler',
//   })
//   isSelected (): NxsResult<'WizardBundler', 'isSelected'> {
//     return this.wizard.bundler?.id === this.bundler
//   }
// }
