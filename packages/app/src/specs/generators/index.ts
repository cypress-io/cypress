import { keyBy } from 'lodash'
import type { SpecGenerator, GeneratorId } from './types'
import { ComponentGenerator } from './component'
import { StoryGenerator } from './story'
import { ScaffoldGenerator } from './scaffold'
import { EmptyGenerator } from './empty'

export * from './types'

export * from './GeneratorsCommon'

export * from './component'

export * from './story'

export * from './scaffold'

export * from './empty'

export const generatorList: SpecGenerator[] = [
  ComponentGenerator,
  StoryGenerator,
  ScaffoldGenerator,
  EmptyGenerator,
]

export const generators = keyBy(generatorList, 'id') as Record<GeneratorId, SpecGenerator>
