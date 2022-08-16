export interface Schema {
  // The name of the spec.
  name: string

  // The path to create the spec.
  path?: string

  // The name of the project.
  project?: string

  // The name of the project.
  testingType: 'e2e' | 'component'

  e2e?: boolean

  component?: boolean
}
