import { objectType } from 'nexus'

export const BaseSpec = objectType({
  name: 'BaseSpec',
  node: 'absolute',
  description: 'Most basic representation of a spec in Cypress',
  definition (t) {
    t.nonNull.field('absolute', {
      description: 'Absolute path to spec',
      type: 'String',
    })

    t.nonNull.field('relative', {
      description: 'Relative path spec',
      type: 'String',
    })

    t.nonNull.field('name', {
      description: 'Spec filename, including extension',
      type: 'String',
    })
  },
})
