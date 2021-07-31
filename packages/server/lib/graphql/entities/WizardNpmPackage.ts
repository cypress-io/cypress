import { nxs, NxsResult } from 'nexus-decorators'
import { NpmPackages, PACKAGES_DESCRIPTIONS } from '../constants'

@nxs.objectType({
  description: 'Details about an NPM Package listed during the wizard install',
})
export class WizardNpmPackage {
  constructor (private pkg: NpmPackages) {}

  @nxs.field.nonNull.string({
    description: 'The package name that you would npm install',
  })
  name (): NxsResult<'WizardNpmPackage', 'name'> {
    return this.pkg
  }

  @nxs.field.nonNull.string()
  description (): NxsResult<'WizardNpmPackage', 'description'> {
    return PACKAGES_DESCRIPTIONS[this.pkg]
  }
}
