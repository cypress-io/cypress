import { keyBy } from 'lodash'
import { computed } from 'vue'
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

export const getFilteredGeneratorList = (currentProject) => {
  return computed(() => generatorList.filter((g) => g.matches(currentProject.currentTestingType) && (g.show === undefined ? true : g.show(currentProject))))
}

export const generators = keyBy(generatorList, 'id') as Record<GeneratorId, SpecGenerator>
