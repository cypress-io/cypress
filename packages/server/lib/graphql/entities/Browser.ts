import { nxs } from 'nexus-decorators'
import { proxyEntity } from '../util/proxyEntity'
import { RelayNode } from './Node'

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

export const BrowserState = nxs.enumType('browserState', ['opening', 'opened', 'closed'])

@nxs.objectType()
export class Browser extends RelayNode {
  constructor (readonly data: BrowserData) {
    super()

    return proxyEntity(this)
  }

  get _id () {
    return this.data.name
  }

  @nxs.field.type(() => BrowserState)
  get state () {
    return 'closed'
  }
}
