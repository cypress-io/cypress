import { nxs, NxsResult } from 'nexus-decorators'
import { FrontendFramework } from '../constants'
import { Wizard } from './Wizard'
import { WizardBundler } from './WizardBundler'

@nxs.objectType({
  description: 'Config file to start a dev server for Component Testing',
})
export class WizardCypressDevServerConfig {
  // constructor (private wizard: Wizard, private framework: FrontendFramework, private bundler: WizardBundler) {}
  constructor () {}

  @nxs.field.nonNull.string({
    description: 'JS version of the config file',
  })
  get js (): NxsResult<'WizardCypressDevServerConfig', 'js'> {
    return 'js'
  }

  @nxs.field.nonNull.string({
    description: 'TS version of the config file',
  })
  get ts (): NxsResult<'WizardCypressDevServerConfig', 'ts'> {
    return 'ts'
  }
}

