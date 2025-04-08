import type { ProtocolManagerShape } from '../protocol'
import type { StudioEvent, StudioServerShape } from './studio-server-types'

export * from './studio-server-types'

export const STUDIO_STATUSES = ['NOT_INITIALIZED', 'INITIALIZED', 'ENABLED', 'IN_ERROR'] as const

export type StudioStatus = typeof STUDIO_STATUSES[number]

export interface StudioManagerShape extends StudioServerShape {
  status: StudioStatus
  isProtocolEnabled: boolean
  protocolManager?: ProtocolManagerShape
  captureStudioEvent: (event: StudioEvent) => Promise<void>
}

export type StudioErrorReport = {
  studioHash?: string | null
  errors: Error[]
}
