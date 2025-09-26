import { objectType } from 'nexus'
import { ReactComponentDescriptor } from './gql-ReactComponentDescriptor'

export const ReactComponentResponse = objectType({
  name: 'ReactComponentResponse',
  description: 'Response from getReactComponentsFromFile',
  definition (t) {
    t.nonNull.list.nonNull.field('components', {
      type: ReactComponentDescriptor,
      description: 'Components that are exported from the parsed file',
    })

    t.boolean('errored', {
      description: 'Whether or not there was there an error when parsing the file',
    })
  },
})
