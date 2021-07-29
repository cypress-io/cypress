import { nxs, NxsResult } from 'nexus-decorators'

@nxs.objectType({
  description: 'Details about an NPM Package listed during the wizard install',
})
export class WizardNpmPackage {
  @nxs.field.string({
    description: 'The package name that you would npm install',
  })
  name (): NxsResult<'WizardNpmPackage', 'name'> {
    return 'name'
  }

  @nxs.field.string()
  description (): NxsResult<'WizardNpmPackage', 'description'> {
    return 'description'
  }
}
