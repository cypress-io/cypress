import { nxs, NxsQueryResult } from 'nexus-decorators'
import { App } from './App'

export class Query {
  @nxs.queryField(() => {
    return { type: App }
  })
  static app (_, ctx: NexusGen['context']): NxsQueryResult<'app'> {
    return new App()
  }
}
