import type { CloudSpecRun } from '../../../../graphql/src/gen/cloud-source-types.gen'
import type { CloudRunStatus } from '@packages/app/src/generated/graphql'

export const randomRunStatus: () => CloudRunStatus = () => {
  const r = Math.floor(Math.random() * 5)

  switch (r) {
    case 0: return 'CANCELLED'
    case 1: return 'ERRORED'
    case 2: return 'FAILED'
    case 3: return 'PASSED'
    default: return 'RUNNING'
  }
}

export const fakeRuns: (statuses: CloudRunStatus[]) => CloudSpecRun[] = (statuses) => {
  return statuses.map((s, idx) => {
    return {
      id: `SpecRun_${idx}`,
      status: s,
      createdAt: new Date('2022-05-08T03:17:00').toISOString(),
      runNumber: 432,
      groupCount: 2,
      specDuration: {
        min: 143.3333, // 2:23
        max: 159.767, // 3:40
      },
      testsFailed: {
        min: 1,
        max: 2,
      },
      testsPassed: {
        min: 22,
        max: 23,
      },
      testsSkipped: {
      },
      testsPending: {
        min: 1,
        max: 2,
      },
      url: 'https://google.com',
    }
  })
}
