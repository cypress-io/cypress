import { objectType } from 'nexus'

export const ReactComponentDescriptor = objectType({
  name: 'ReactComponentDescriptor',
  description: 'Properties describing a React component',
  definition (t) {
    t.nonNull.string('displayName', {
      description: 'The name of the component',
    })
  },
})
