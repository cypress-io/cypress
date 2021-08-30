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
  get status (): NxsResult<'RunGroup', 'status'> {
    return this.config.status
  }

  @nxs.field.nonNull.string()
  get createdAt (): NxsResult<'RunGroup', 'createdAt'> {
    return this.config.createdAt
  }

  @nxs.field.nonNull.string()
  get completedAt (): NxsResult<'RunGroup', 'completedAt'> {
    return this.config.completedAt
  }

  @nxs.field.int()
  get totalPassed (): NxsResult<'RunGroup', 'totalPassed'> {
    return this.config.totalPassed ?? null
  }

  @nxs.field.int()
  get totalFailed (): NxsResult<'RunGroup', 'totalFailed'> {
    return this.config.totalFailed ?? null
  }

  @nxs.field.int()
  get totalPending (): NxsResult<'RunGroup', 'totalPending'> {
    return this.config.totalPending ?? null
  }

  @nxs.field.int()
  get totalSkipped (): NxsResult<'RunGroup', 'totalSkipped'> {
    return this.config.totalSkipped ?? null
  }

  @nxs.field.int()
  get totalDuration (): NxsResult<'RunGroup', 'totalDuration'> {
    return this.config.totalDuration ?? null
  }

  @nxs.field.nonNull.type(() => RunCommit)
  get commit (): NxsResult<'RunGroup', 'commit'> {
    return new RunCommit(this.config.commit)
  }
}
