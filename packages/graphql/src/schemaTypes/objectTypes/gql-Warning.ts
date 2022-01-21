import { objectType } from 'nexus'

export const Warning = objectType({
  name: 'Warning',
  description: 'A generic warning',
  definition (t) {
    t.nonNull.string('title')
    t.nonNull.string('message')
    t.string('details')
  },
  sourceType: {
    module: '@packages/types',
    export: 'Warning',
  },
})
