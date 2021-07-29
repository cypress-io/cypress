import { nxs, NxsResult } from 'nexus-decorators'
import { Bundler, BundlerDisplayNames, BundlerEnum, BundlerPackageNames } from '../constants'
import { Wizard } from './Wizard'

@nxs.objectType({
  description: 'Wizard bundler',
})
export class WizardBundler {
  constructor (private wizard: Wizard, private bundler: Bundler) {}

  @nxs.field.nonNull.type(() => BundlerEnum)
  get id (): NxsResult<'WizardBundler', 'id'> {
    return this.bundler
  }

  @nxs.field.nonNull.string()
  get name (): NxsResult<'WizardBundler', 'name'> {
    return BundlerDisplayNames[this.bundler]
  }

  @nxs.field.nonNull.string()
  get package (): NxsResult<'WizardBundler', 'package'> {
    return BundlerPackageNames[this.bundler]
  }

  @nxs.field.boolean({
    description: 'Whether this is the selected framework bundler',
  })
  isSelected (): NxsResult<'WizardBundler', 'isSelected'> {
    return this.wizard.bundler?.id === this.bundler
  }

  @nxs.field.boolean({
    description: 'Whether there are multiple options to choose from given the framework',
  })
  isOnlyOption (): NxsResult<'WizardBundler', 'isOnlyOption'> {
    // TODO: base this on the options available
    return false
  }
}
