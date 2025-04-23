import type { ProtocolManagerShape } from '../protocol'
import type { StudioServerShape } from './studio-server-types'

export * from './studio-server-types'

export const STUDIO_STATUSES = ['NOT_INITIALIZED', 'INITIALIZED', 'ENABLED', 'IN_ERROR'] as const

export type StudioStatus = typeof STUDIO_STATUSES[number]

export interface StudioManagerShape extends StudioServerShape {
  status: StudioStatus
  isProtocolEnabled: boolean
  protocolManager?: ProtocolManagerShape
}

export interface StudioLifecycleManagerShape {
  getStudio: () => Promise<StudioManagerShape | null>
  onStudioReady: (listener: (studioManager: StudioManagerShape) => void) => () => void
  isStudioReady: () => boolean
  getStudioIfReady: () => Promise<StudioManagerShape | null> | null
}

export type StudioErrorReport = {
  studioHash?: string | null
  errors: Error[]
}
