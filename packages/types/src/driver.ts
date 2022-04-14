export interface RunState {
  startTime?: number
  currentId?: number
  emissions?: Emissions
  tests?: unknown
  passed?: number
  failed?: number
  pending?: number
  numLogs?: number
}

export interface Emissions {
  started: Record<string, boolean>
  ended: Record<string, boolean>
}
