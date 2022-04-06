import { keyBy } from 'lodash'
import type { SpecGenerator, GeneratorId } from './types'
import { ScaffoldGenerator } from './scaffold'
import { EmptyGenerator } from './empty'

export * from './types'

export * from './GeneratorsCommon'

export * from './scaffold'

export * from './empty'

export const generatorList: SpecGenerator[] = [
  ScaffoldGenerator,
  EmptyGenerator,
]

export const generators = keyBy(generatorList, 'id') as Record<GeneratorId, SpecGenerator>
