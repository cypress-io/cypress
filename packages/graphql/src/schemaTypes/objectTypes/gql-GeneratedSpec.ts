import { objectType } from 'nexus'
import { FileParts } from './gql-FileParts'

export const GeneratedSpec = objectType({
  name: 'GeneratedSpec',
  definition (t) {
    t.nonNull.id('id', {
      resolve: (src, args, ctx) => src.spec.absolute,
    })

    t.nonNull.string('content', {
      description: 'File content of most recently generated spec.',
    })

    t.nonNull.field('spec', {
      type: FileParts,
    })
  },
})
