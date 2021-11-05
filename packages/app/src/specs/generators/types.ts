import type { Component } from 'vue'

export type GeneratorId = 'component-generator' | 'empty-generator' | 'scaffold-generator' | 'story-generator'

export interface SpecGenerator {
  card: Component
  entry: Component
  matches: (testingType) => boolean
  disabled: (activeProject?) => boolean | void
  id: GeneratorId
}
