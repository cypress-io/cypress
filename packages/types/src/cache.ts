export type Cache = {
  PROJECTS: string[]
  PROJECT_PREFERENCES: ProjectPreferences
  USER: CachedUser
}

export type ProjectPreferences = { [key: string]: Preferences}

export type Preferences = {
  browserId: string
  testingType: 'e2e' | 'component'
}

export type CachedUser = {
  authToken: any
  name: any
  email: any
}
