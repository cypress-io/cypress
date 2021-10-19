export interface Cache {
  PROJECTS: string[]
  PROJECT_PREFERENCES: Record<string, Preferences>
  USER: CachedUser
}

export interface Preferences {
  browserId: string | null
  testingType: 'e2e' | 'component' | null
}

export interface CachedUser {
  authToken: string
  name: string
  email: string
}
