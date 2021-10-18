export type Cache = {
  PROJECTS: string[]
  PROJECT_PREFERENCES: ProjectPreferences
  USER: CachedUser
}

export type ProjectPreferences = { [project: string]: Preferences}

export type Preferences = {
  browserId: string | null
  testingType: 'e2e' | 'component' | null
}

export type CachedUser = {
  authToken: any
  name: any
  email: any
}
