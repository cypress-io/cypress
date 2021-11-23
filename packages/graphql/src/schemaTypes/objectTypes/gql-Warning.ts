import { objectType } from 'nexus'

export const Warning = objectType({
  name: 'Warning',
  description: 'A warning',
  definition (t) {
    t.nonNull.string('title')
    t.nonNull.string('message')
    t.string('setupStep')
  },
  sourceType: {
    module: '@packages/types',
    export: 'Warning',
  },
})
