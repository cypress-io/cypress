import { objectType } from 'nexus'

export const AutInspectAttr = objectType({
  name: 'AutInspectAttr',
  description: 'A single HTML attribute on an AUT DOM match.',
  definition (t) {
    t.nonNull.string('name')
    t.nonNull.string('value')
  },
})
