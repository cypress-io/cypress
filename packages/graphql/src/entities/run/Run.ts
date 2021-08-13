import { nxs, NxsResult } from 'nexus-decorators'
import { RunGroupStatus, RunGroupStatusEnum } from '../../constants'
import { RunCommit } from './RunCommit'

export interface RunCommitConfig {
  authorEmail: string
  authorName: string
  branch: string
  message: string
  sha: string
  url: string
}

export interface RunGroupTotals {
  totalPassed: number | null
  totalFailed: number | null
  totalPending: number | null
  totalSkipped: number | null
  totalDuration: number | null
}

export interface RunGroupConfig extends RunGroupTotals {
  status: RunGroupStatus
  id: string
  completedAt: string
  createdAt: string
  commit: RunCommitConfig
}

@nxs.objectType({
  description: 'Represents a run on Cypress Cloud',
})
export class RunGroup {
  constructor (private config: RunGroupConfig) {}

  @nxs.field.nonNull.type(() => RunGroupStatusEnum)
  get status (): NxsResult<'Run', 'status'> {
    return this.config.status
  }

  @nxs.field.nonNull.string()
  get createdAt (): NxsResult<'Run', 'createdAt'> {
    return this.config.createdAt
  }

  @nxs.field.nonNull.string()
  get completedAt (): NxsResult<'Run', 'completedAt'> {
    return this.config.completedAt
  }

  @nxs.field.int()
  get totalPassed (): NxsResult<'Run', 'totalPassed'> {
    return this.config.totalPassed
  }

  @nxs.field.int()
  get totalFailed (): NxsResult<'Run', 'totalFailed'> {
    return this.config.totalFailed
  }

  @nxs.field.int()
  get totalPending (): NxsResult<'Run', 'totalPending'> {
    return this.config.totalPending
  }

  @nxs.field.int()
  get totalSkipped (): NxsResult<'Run', 'totalSkipped'> {
    return this.config.totalSkipped
  }

  @nxs.field.nonNull.int()
  get totalDuration (): NxsResult<'Run', 'totalDuration'> {
    return this.config.totalDuration
  }

  @nxs.field.nonNull.type(() => RunCommit)
  get commit (): NxsResult<'Run', 'commit'> {
    return new RunCommit(this.config.commit)
  }
}
