import type { FunctionalComponent, SVGAttributes, Component } from 'vue'

export type GeneratorId = 'import-from-component' | 'import-from-empty' | 'import-from-scaffold' | 'import-from-story'

export interface SpecGenerator {
  card: Component
  entry: Component
  matches: (testingType) => boolean
  id: GeneratorId
}

