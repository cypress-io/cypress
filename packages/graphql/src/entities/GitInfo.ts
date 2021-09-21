import { nxs, NxsResult } from 'nexus-decorators'
import type { GitInfo as GetGitInfo } from '@packages/types'

@nxs.objectType({
  description: 'Git info about a file',
})
export class GitInfo {
  constructor (private config: GetGitInfo | null) {}

  @nxs.field.string({
    description: 'author of the file',
  })
  get author (): NxsResult<'GitInfo', 'author'> {
    return this.config?.author ?? null
  }

  @nxs.field.string({
    description: 'last modified timestamp, eg 2021-09-14 13:43:19 +1000',
  })
  get lastModifiedTimestamp (): NxsResult<'GitInfo', 'lastModifiedTimestamp'> {
    return this.config?.lastModifiedTimestamp ?? null
  }

  @nxs.field.string({
    description: 'last modified as a pretty string, eg 2 days ago',
  })
  get lastModifiedHumanReadable (): NxsResult<'GitInfo', 'lastModifiedHumanReadable'> {
    return this.config?.lastModifiedHumanReadable ?? null
  }
}
