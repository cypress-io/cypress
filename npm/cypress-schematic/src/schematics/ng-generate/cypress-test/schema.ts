export interface Schema {
  // Custom filename.
  filename?: string

  // The name of the spec.
  name: string

  // The path to create the spec.
  path?: string

  // The name of the project.
  project?: string

  // Create a component spec
  component?: boolean
}
