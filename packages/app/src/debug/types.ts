import type { SpecDataAggregate, CloudRunInstance } from '@packages/data-context/src/gen/graphcache-config.gen'

export interface Spec {
  id: string
  path: string
  fileName: string
  fileExtension: string
  testsPassed: SpecDataAggregate | null
  testsFailed: SpecDataAggregate | null
  testsPending: SpecDataAggregate | null
  specDuration: SpecDataAggregate | null
  fullPath: string
}

export interface TestResults {
  readonly id: string
  readonly titleParts: ReadonlyArray<string>
  readonly instance: CloudRunInstance | null
}

export type ArtifactType = 'TERMINAL_LOG' | 'IMAGE_SCREENSHOT' | 'PLAY'
