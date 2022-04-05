import { keyBy } from 'lodash'
import type { SpecGenerator, GeneratorId } from './types'
import { ComponentGenerator } from './component'
import { ScaffoldGenerator } from './scaffold'
import { EmptyGenerator } from './empty'

export * from './types'

export * from './GeneratorsCommon'

export * from './component'

export * from './scaffold'

export * from './empty'

export const generatorList: SpecGenerator[] = [
  ComponentGenerator,
  ScaffoldGenerator,
  EmptyGenerator,
]

export const generators = keyBy(generatorList, 'id') as Record<GeneratorId, SpecGenerator>
