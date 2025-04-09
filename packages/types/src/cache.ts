export interface Cache {
  PROJECTS: string[]
  PROJECT_PREFERENCES: Record<string, Preferences>
  USER: CachedUser
  COHORTS: Record<string, Cohort>
  PROJECTS_CONFIG: Record<string, any>
}

import type { AllowedState } from './preferences'

export type Preferences = AllowedState

export interface CachedUser {
  authToken: string
  name: string
  email: string
}

export interface Cohort {
  name: string
  cohort: string
}
