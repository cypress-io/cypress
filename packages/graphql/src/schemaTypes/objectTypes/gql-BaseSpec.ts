import { objectType } from 'nexus'
import { baseSpecDefinition } from '../../definitions/'

export const BaseSpec = objectType({
  name: 'BaseSpec',
  node: 'absolute',
  description: 'Most basic representation of a spec in Cypress',
  definition: baseSpecDefinition,
})
