import { objectType } from 'nexus'
import { AutInspectAttr } from './gql-AutInspectAttr'

export const AutInspectDomMatch = objectType({
  name: 'AutInspectDomMatch',
  description: 'One element in the AUT matching a CSS selector. Text and outerHTML are truncated by the runner.',
  definition (t) {
    t.nonNull.string('tag', {
      description: 'Lower-cased tag name, e.g. `div`.',
    })

    t.string('text', {
      description: 'Truncated `textContent` (up to 500 chars). Null when the element has no text.',
    })

    t.nonNull.list.nonNull.field('attrs', {
      type: AutInspectAttr,
      description: 'HTML attributes on the element, in document order.',
    })

    t.nonNull.string('outerHTML', {
      description: 'Truncated `outerHTML` (up to 2048 chars).',
    })
  },
})
