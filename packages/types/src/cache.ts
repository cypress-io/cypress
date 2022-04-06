export interface Cache {
  PROJECTS: string[]
  PROJECT_PREFERENCES: Record<string, Preferences>
  USER: CachedUser
}

import type { AllowedState } from './preferences'

export type Preferences = AllowedState

export interface CachedUser {
  authToken: string
  name: string
  email: string
}
