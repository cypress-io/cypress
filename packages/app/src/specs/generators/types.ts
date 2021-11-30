import type { Component } from 'vue'
import type { TestingTypeEnum, CreateSpecCardsFragment } from '../../generated/graphql'

export type GeneratorId = 'component-generator' | 'empty-generator' | 'scaffold-generator' | 'story-generator'

export interface SpecGenerator {
  card: Component
  entry: Component
  matches: (testingType: TestingTypeEnum) => boolean
  disabled: (currentProject?: CreateSpecCardsFragment['currentProject'] | null) => boolean
  id: GeneratorId
}
