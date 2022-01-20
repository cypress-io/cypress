import { DateTimeResolver, JSONResolver } from 'graphql-scalars'
import { asNexusMethod } from 'nexus'

// Apollo VSCode is having trouble with this directive
JSONResolver.specifiedByUrl = null

export const customScalars = [
  asNexusMethod(JSONResolver, 'json'),
  asNexusMethod(DateTimeResolver, 'dateTime'),
]
