import { objectType } from 'nexus'

export const Warning = objectType({
  name: 'Warning',
  description: 'A warning',
  definition (t) {
    t.nonNull.string('title')
    t.nonNull.string('message')
    t.string('setupStep')
    t.boolean('dismissable', {
      description: 'If true, we have the ability to dismiss this warning',
    })
  },
  sourceType: {
    module: '@packages/types',
    export: 'Warning',
  },
})
