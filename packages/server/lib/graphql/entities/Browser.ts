import { nxs } from 'nexus-decorators'
import { proxyEntity } from '../util/proxyEntity'

interface BrowserData {
  displayName: string
  name: string
  family: string
  channel: string
  version: string
  path: string
  profilePath: string
  majorVersion: string
  info: string
  custom: string
  warning: string
}

@nxs.objectType()
export class Browser {
  constructor (readonly data: BrowserData) {
    return proxyEntity(this)
  }

  @nxs.mutationField({
    type: 'Query',
  })
  static closeBrowser () {
    //
  }
}
