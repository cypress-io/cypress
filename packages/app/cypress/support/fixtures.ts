import { createCloudRun, createCloudRunCommitInfo } from '@packages/graphql/test/stubCloudTypes'
import type { CloudRunStatus } from '../../src/generated/graphql-test'
import type { AutSnapshot } from '../../src/runner/iframe-model'

export const autSnapshot: AutSnapshot = {
  id: 1,
  name: 'DOM Test Snapshot',
  $el: null,
  coords: [0, 0],
  scrollBy: {
    x: 0,
    y: 0,
  },
  highlightAttr: '',
  // @ts-ignore
  snapshots: [{ name: 'Before' }, { name: 'After' }],
  htmlAttrs: {},
  viewportHeight: 500,
  viewportWidth: 500,
  url: 'http://localhost:3000',
  body: {
    get: () => {},
  },
}

export function createRun (data: {
  runNumber: number
  status: CloudRunStatus
  sha: string
  summary: string
  completedInstanceCount?: number
  totalInstanceCount?: number
  createdAt?: string
}) {
  return {
    ...createCloudRun({
      completedInstanceCount: data.completedInstanceCount ?? 10,
      totalInstanceCount: data.totalInstanceCount ?? 10,
      ...(!!data.createdAt && { createdAt: data.createdAt }),
    }),
    runNumber: data.runNumber,
    status: data.status,
    commitInfo: {
      ...createCloudRunCommitInfo({}),
      sha: data.sha,
      summary: data.summary,
    },
  }
}
