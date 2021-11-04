import { keyBy } from 'lodash'
import type { SpecGenerator, GeneratorId } from './types'
import * as Component from './component'
import * as Story from './story'
import * as Scaffold from './scaffold'
import * as Empty from './empty'

export * from './types'

export * from './GeneratorsCommon'

export * from './component'

export * from './story'

export * from './scaffold'

export * from './empty'

export const generatorList: SpecGenerator[] = [
  Scaffold.ImportFromScaffoldGenerator,
  Component.ImportFromComponentGenerator,
  Empty.ImportEmptySpecGenerator,
  Story.ImportFromStoryGenerator,
]

export const generators = keyBy(generatorList, 'id') as Record<GeneratorId, SpecGenerator>
