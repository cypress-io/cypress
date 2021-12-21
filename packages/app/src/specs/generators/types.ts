import type { Component } from 'vue'

export type GeneratorId = 'component' | 'empty' | 'scaffold' | 'story'

export interface SpecGenerator {
  card: Component
  entry: Component
  matches: (testingType) => boolean
  disabled: (currentProject?) => boolean | void
  id: GeneratorId
}
