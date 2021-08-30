import { nxs, NxsResult } from 'nexus-decorators'
import type { RunCommitConfig } from './Run'

@nxs.objectType({
  description: 'Represents a commit on run on Cypress Cloud',
})
export class RunCommit {
  constructor (private config: RunCommitConfig) {}

  @nxs.field.nonNull.string()
  get authorName (): NxsResult<'RunCommit', 'authorName'> {
    return this.config.authorName
  }

  @nxs.field.nonNull.string()
  get authorEmail (): NxsResult<'RunCommit', 'authorEmail'> {
    return this.config.authorEmail
  }

  @nxs.field.nonNull.string()
  get branch (): NxsResult<'RunCommit', 'branch'> {
    return this.config.branch
  }

  @nxs.field.nonNull.string()
  get message (): NxsResult<'RunCommit', 'message'> {
    return this.config.message
  }

  @nxs.field.nonNull.string()
  get sha (): NxsResult<'RunCommit', 'sha'> {
    return this.config.sha
  }

  @nxs.field.nonNull.string()
  get url (): NxsResult<'RunCommit', 'url'> {
    return this.config.url
  }
}
