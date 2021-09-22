import { FrontendFrameworkEnum } from '../constants'
import { WizardBundler } from './WizardBundler'
import { objectType } from 'nexus'

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
    })

    t.nonNull.string('name', {
      description: 'The name of the framework',
    })

    t.nonNull.list.nonNull.field('supportedBundlers', {
      type: WizardBundler,
      description: 'All of the supported bundlers for this framework',
      resolve: () => {
        return []
      },
    })
  },
})

// @nxs.objectType({
//   description: 'A frontend framework that we can setup within the app',
// })
// export class WizardFrontendFramework {
//   constructor (private wizard: Wizard, private framework: FrontendFramework) {}

//   @nxs.field.nonNull.type(() => FrontendFrameworkEnum, {
//     description: 'The name of the framework',
//   })
//   get id (): NxsResult<'WizardFrontendFramework', 'id'> {
//     return this.framework
//   }

//   @nxs.field.nonNull.string({
//     description: 'The name of the framework',
//   })
//   get name (): NxsResult<'WizardFrontendFramework', 'name'> {
//     return FrameworkDisplayNames[this.framework]
//   }

//   @nxs.field.nonNull.list.nonNull.type(() => WizardBundler, {
//     description: 'All of the supported bundlers for this framework',
//   })
//   get supportedBundlers (): NxsResult<'WizardFrontendFramework', 'supportedBundlers'> {
//     if (!this.wizard.framework || this.wizard.framework.id === 'react' || this.wizard.framework.id === 'vue') {
//       return BUNDLER.map((bundler) => new WizardBundler(this.wizard, bundler))
//     }

//     return [new WizardBundler(this.wizard, 'webpack')]
//   }

//   @nxs.field.nonNull.boolean({
//     description: 'Whether this is the selected framework in the wizard',
//   })
//   get isSelected (): NxsResult<'WizardFrontendFramework', 'isSelected'> {
//     return this.wizard.framework?.id === this.framework
//   }
// }
