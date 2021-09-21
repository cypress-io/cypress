
import { nxs, NxsResult } from "nexus-decorators";

interface PageInfoConfig {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor?: string
  endCursor?:  string
}

@nxs.objectType({
  description: 'PageInfo object complaint with Relay spec'
})
export class PageInfo {
  constructor (private _config: PageInfoConfig) {}

  @nxs.field.string()
  get startCursor () : NxsResult<'PageInfo', 'startCursor'> {
    return this._config?.startCursor ?? null
  }

  @nxs.field.string()
  get endCursor () : NxsResult<'PageInfo', 'endCursor'> {
    return this._config?.endCursor ?? null
  }

  @nxs.field.nonNull.boolean()
  get hasNextPage () : NxsResult<'PageInfo', 'hasNextPage'> {
    return this._config.hasNextPage
  }

  @nxs.field.nonNull.boolean()
  get hasPreviousPage () : NxsResult<'PageInfo', 'hasPreviousPage'> {
    return this._config.hasPreviousPage
  }
}