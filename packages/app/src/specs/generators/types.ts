import type { FunctionalComponent, SVGAttributes, Component } from 'vue'
import type { TestingTypeEnum } from '../../generated/graphql';

export type GeneratorId = 'import-from-component' | 'import-from-empty' | 'import-from-scaffold' | 'import-from-story' | unknown

export interface SpecGenerator {
  card: Component
  entry: Component
  matches: (testingType: TestingTypeEnum) => boolean
  id: GeneratorId
}

