export interface Schema {
  // The name of the spec.
  name: string

  fileName?: string

  // The path to create the spec.
  path?: string

  // The name of the project.
  project?: string

  // The type of spec to create.
  testingType: 'e2e' | 'component'

  e2e?: boolean

  component?: boolean
}
