import { DateTimeResolver, JSONResolver } from 'graphql-scalars'
import { asNexusMethod } from 'nexus'

export const customScalars = [
  asNexusMethod(JSONResolver, 'json'),
  asNexusMethod(DateTimeResolver, 'dateTime'),
]
