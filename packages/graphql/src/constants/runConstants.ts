import { enumType } from 'nexus'

// https://github.com/cypress-io/cypress-services/blob/e4689bd41e84954964653a7022f09e7aae962f46/packages/common/src/enums.ts
// need to find a way to share code between services and runner monorepo

export const RUN_GROUP_STATUS = [
  'unclaimed',
  'running',
  'errored',
  'failed',
  'timedOut',
  'passed',
  'noTests',
  'cancelled',
] as const

export type RunGroupStatus = typeof RUN_GROUP_STATUS[number]

export const RunGroupStatusEnum = enumType({
  name: 'RunGroupStatus',
  members: RUN_GROUP_STATUS,
})
