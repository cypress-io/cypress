import { nxs } from 'nexus-decorators'
import { proxyEntity } from '../util/proxyEntity'

export interface AppOptionsData {
  os: string
  cypressEnv: string
  projectRoot: string
}

//

@nxs.objectType({
  definition (t) {
    t.string('cypressEnv')
    t.string('os')
    t.string('projectRoot')
    t.string('proxySource')
    t.string('proxyServer')
    t.string('proxyBypassList')
  },
})
export class AppOptions {
  constructor (readonly data: AppOptionsData) {
    return proxyEntity(this)
  }
}
