import type { TestingType } from '@packages/types'
import type { Component } from 'vue'

export type GeneratorId = 'component' | 'empty' | 'scaffold'

type CurrentProject = {
  readonly __typename?: 'CurrentProject' | undefined
  readonly id: string
  readonly config: any[]
  readonly codeGenGlobs?: {
    readonly component: string
  }
}

export interface SpecGenerator {
  card: Component
  entry: Component
  matches: (testingType?: TestingType | null) => boolean
  show: (currentProject?: CurrentProject) => boolean
  disabled: (currentProject?: CurrentProject | null) => boolean | void
  id: GeneratorId
}
