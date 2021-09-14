import { nxs, NxsResult } from 'nexus-decorators'
import { BrowserFamilyEnum } from '../constants'
import type { BrowserContract } from '../contracts/BrowserContract'

@nxs.objectType({
  description: 'Container representing a browser',
})
export class Browser implements BrowserContract {
  constructor (private _config: BrowserContract) {}

  @nxs.field.nonNull.string()
  get name (): NxsResult<'Browser', 'name'> {
    return this._config.name
  }

  @nxs.field.nonNull.type(() => BrowserFamilyEnum)
  get family (): NxsResult<'Browser', 'family'> {
    return this._config.family
  }

  @nxs.field.nonNull.string()
  get channel (): NxsResult<'Browser', 'channel'> {
    return this._config.channel
  }

  @nxs.field.nonNull.string()
  get displayName (): NxsResult<'Browser', 'displayName'> {
    return this._config.displayName
  }

  @nxs.field.nonNull.string()
  get path (): NxsResult<'Browser', 'path'> {
    return this._config.path
  }

  @nxs.field.nonNull.string()
  get version (): NxsResult<'Browser', 'version'> {
    return this._config.version
  }

  @nxs.field.string()
  get majorVersion (): NxsResult<'Browser', 'majorVersion'> {
    return this._config.majorVersion?.toString() ?? null
  }

  get config (): BrowserContract {
    return this._config
  }
}
