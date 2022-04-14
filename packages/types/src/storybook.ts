import type { FoundSpec } from './spec'

export interface StorybookFile {
  name: string
  absolute: string
  relative: string
  content: string
}

export interface StorybookInfo {
  storybookRoot: string
  files: StorybookFile[]
}

export interface GeneratedSpec {
  spec: FoundSpec
  content: string
}
