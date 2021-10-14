export interface StorybookFile {
  name: string
  absolute: string
  relative: string
  content: string
}

export interface StorybookInfo {
  storybookRoot: string
  files: StorybookFile[]
  storyGlobs: string[]
}
