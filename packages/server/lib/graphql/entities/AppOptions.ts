import { nxs } from 'nexus-decorators'
import { proxyEntity } from '../util/proxyEntity'

export interface AppOptionsData {
  os: string
  cypressEnv: string
  projectRoot: string
  config: unknown
  cwd: string
}

//

//
@nxs.objectType({
  definition (t) {
    t.string('cypressEnv')
    t.string('os', {
      description: 'The current OS we are using',
    })

    t.string('projectRoot')
    t.string('proxySource')
    t.string('proxyServer')
    t.string('proxyBypassList')
    t.boolean('invokedFromCli', {
      description: 'Whether we opened Cypress from the CLI',
    })

    t.string('cwd')
    t.string('testingType')
    t.json('config')
    t.list.string('argv')
  },
})
export class AppOptions {
  constructor (readonly data: AppOptionsData) {
    return proxyEntity(this)
  }
}
