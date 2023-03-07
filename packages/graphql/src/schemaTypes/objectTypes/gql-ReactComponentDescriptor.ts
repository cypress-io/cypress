import { objectType } from 'nexus'

export const ReactComponentDescriptor = objectType({
  name: 'ReactComponentDescriptor',
  description: 'Properties describing a React component',
  definition (t) {
    t.nonNull.string('exportName', {
      description: 'The name of the component export e.g. "export const Foo"',
    })

    t.nonNull.boolean('isDefault', {
      description: 'Whether the component is a default export e.g. "export default Foo"',
    })
  },
})
