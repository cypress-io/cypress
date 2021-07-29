import { nxs, NxsResult } from 'nexus-decorators'

@nxs.objectType({
  description: 'Config file to start a dev server for Component Testing',
})
export class WizardCypressDevServerConfig {
  @nxs.field.nonNull.string({
    description: 'JS version of the config file',
  })
  get js (): NxsResult<'WizardCypressDevServerConfig', 'js'> {
    return 'todo: js'
  }

  @nxs.field.nonNull.string({
    description: 'TS version of the config file',
  })
  get ts (): NxsResult<'WizardCypressDevServerConfig', 'ts'> {
    return 'todo: ts'
  }
}
