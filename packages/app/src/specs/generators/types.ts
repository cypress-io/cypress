import type { TestingType } from '@packages/types'
import type { Component } from 'vue'

export type GeneratorId = 'component' | 'empty' | 'scaffold' | 'story'

type CurrentProject = {
  readonly __typename?: 'CurrentProject' | undefined
  readonly id: string
}

export interface SpecGenerator {
  card: Component
  entry: Component
  matches: (testingType?: TestingType | null) => boolean
  disabled: (currentProject?: CurrentProject | null) => boolean | void
  id: GeneratorId
}
