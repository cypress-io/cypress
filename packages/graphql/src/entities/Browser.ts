import { nxs, NxsResult } from 'nexus-decorators'
import { BrowserFamilyEnum } from '../constants'
import type { BrowserContract } from '../contracts/BrowserContract'

export const browserContactProps = ['name', 'family', 'channel', 'displayName', 'name', 'path', 'version', 'isHeaded', 'isHeadless', 'majorVersion'] as const

@nxs.objectType({
  description: 'Container representing a browser',
})
export class Browser implements BrowserContract {
  constructor (private config: BrowserContract) {}

  @nxs.field.nonNull.string()
  get name (): NxsResult<'Browser', 'name'> {
    return this.config.name
  }

  @nxs.field.nonNull.type(() => BrowserFamilyEnum)
  get family (): NxsResult<'Browser', 'family'> {
    return this.config.family
  }

  @nxs.field.nonNull.string()
  get channel (): NxsResult<'Browser', 'channel'> {
    return this.config.channel
  }

  @nxs.field.nonNull.string()
  get displayName (): NxsResult<'Browser', 'displayName'> {
    return this.config.displayName
  }

  @nxs.field.nonNull.string()
  get path (): NxsResult<'Browser', 'path'> {
    return this.config.path
  }

  @nxs.field.nonNull.string()
  get version (): NxsResult<'Browser', 'version'> {
    return this.config.version
  }

  @nxs.field.nonNull.boolean()
  get isHeaded (): NxsResult<'Browser', 'isHeaded'> {
    return this.config.isHeaded
  }

  @nxs.field.nonNull.boolean()
  get isHeadless (): NxsResult<'Browser', 'isHeadless'> {
    return this.config.isHeadless
  }

  @nxs.field.nonNull.string()
  get majorVersion (): NxsResult<'Browser', 'majorVersion'> {
    return this.config.majorVersion.toString()
  }
}
