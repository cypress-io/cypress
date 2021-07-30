import { nxs, NxsResult } from 'nexus-decorators'
import { FrontendFramework, FrontendFrameworkEnum } from '../constants'
import { WizardBundler } from './WizardBundler'
import { WizardNpmPackage } from './WizardNpmPackage'

@nxs.objectType({
  description: 'A frontend framework that we can setup within the app',
})
export class WizardFrontendFramework {
  constructor (private framework: FrontendFramework, private selected: boolean) {}

  @nxs.field.type(() => FrontendFrameworkEnum, {
    description: 'The name of the framework',
  })
  get name (): NxsResult<'WizardFrontendFramework', 'name'> {
    return this.framework
  }

  @nxs.field.list.type(() => WizardBundler, {
    description: 'All of the supported bundlers for this framework',
  })
  get supportedBundlers (): NxsResult<'WizardFrontendFramework', 'supportedBundlers'> {
    return []
  }

  @nxs.field.list.type(() => WizardNpmPackage, {
    description: 'A list of packages to install, null if we have not chosen both a framework and bundler',
  })
  get packagesToInstall (): NxsResult<'WizardFrontendFramework', 'packagesToInstall'> {
    return []
  }

  @nxs.field.boolean({
    description: 'Whether this is the selected framework in the wizard',
  })
  get isSelected (): NxsResult<'WizardFrontendFramework', 'isSelected'> {
    return this.selected
  }
}
