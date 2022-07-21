import { keyBy } from 'lodash'
import { computed } from 'vue'
import type { TestingType } from '@packages/types'
import type { SpecGenerator, GeneratorId } from './types'
import { ScaffoldGenerator } from './scaffold'
import { EmptyGenerator } from './empty'
import { ComponentGenerator } from './component'

export * from './types'

export * from './GeneratorsCommon'

export * from './scaffold'

export * from './empty'

export const generatorList: SpecGenerator[] = [
  ComponentGenerator,
  ScaffoldGenerator,
  EmptyGenerator,
]

export const getFilteredGeneratorList = (testingType?: TestingType | null, codeGenGlob?: string) => computed(() => generatorList.filter((g) => g.matches(testingType) && (g.show === undefined ? true : g.show(codeGenGlob))))

export const generators = keyBy(generatorList, 'id') as Record<GeneratorId, SpecGenerator>
