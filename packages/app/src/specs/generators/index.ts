import { computed } from 'vue'
import type { SpecGenerator, GeneratorId } from './types'
import { ScaffoldGenerator } from './scaffold'
import { EmptyGenerator } from './empty'
import { VueComponentGenerator, ReactComponentGenerator } from './component'

export * from './types'

export * from './GeneratorsCommon'

export * from './scaffold'

export * from './empty'

const generatorList: SpecGenerator[] = [
  VueComponentGenerator,
  ReactComponentGenerator,
  ScaffoldGenerator,
  EmptyGenerator,
]

export const getFilteredGeneratorList = (currentProject) => {
  return computed(() => generatorList.filter((g) => g.matches(currentProject.currentTestingType) && (g.show === undefined ? true : g.show(currentProject))))
}

export const generators = Object.fromEntries(generatorList.map((item) => [item.id, item])) as Record<GeneratorId, SpecGenerator>
