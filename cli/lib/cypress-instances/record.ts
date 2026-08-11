export {
  INSTANCES_DIRNAME,
  isCompatibleRecord,
  parseRecordPid,
  cypressInstancesDir,
  instancesProbePath,
} from '@packages/cypress-instances'

export type {
  CypressInstance,
  LiveInstanceState,
  ReadyInstanceState,
  InstanceTestingType,
} from '@packages/cypress-instances'

// Instance discovery raises the same `TapError` every other tap failure is raised
// as, so one catch and one renderer cover the whole surface.
export { TapError, isTapError } from '@packages/cypress-instances'
