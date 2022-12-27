export interface StudioRecorderState {
  suiteId?: string
  testId?: string
  url?: string
}

export interface ReporterRunState {
  autoScrollingEnabled?: boolean
  scrollTop?: number
}

export interface StatsStoreStartInfo {
  startTime: string
  numPassed?: number
  numFailed?: number
  numPending?: number
}

export interface ReporterStartInfo extends StatsStoreStartInfo {
  isSpecsListOpen: boolean
  autoScrollingEnabled: boolean
  scrollTop: number
  studioActive: boolean
}
