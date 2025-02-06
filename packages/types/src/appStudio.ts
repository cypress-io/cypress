import type { Router } from 'express'

export const STUDIO_STATUSES = ['NOT_INITIALIZED', 'INITIALIZED', 'IN_ERROR'] as const

export type StudioStatus = typeof STUDIO_STATUSES[number]

export interface StudioManagerShape extends AppStudioShape {
  status: StudioStatus
}

export interface AppStudioShape {
  initializeRoutes(router: Router): void
}

export type StudioErrorReport = {
  studioHash?: string | null
  errors: Error[]
}
