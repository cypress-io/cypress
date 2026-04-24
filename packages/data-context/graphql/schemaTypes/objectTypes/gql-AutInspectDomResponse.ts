import { objectType } from 'nexus'
import { AutInspectDomMatch } from './gql-AutInspectDomMatch'

export const AutInspectDomResponse = objectType({
  name: 'AutInspectDomResponse',
  description: 'Result of an `autInspectDom` query: the CSS selector echoed back, the total match count, and a capped list of match details.',
  definition (t) {
    t.nonNull.string('selector', {
      description: 'The selector that was queried (echoed for convenience).',
    })

    t.nonNull.int('count', {
      description: 'Total number of matches in the AUT before the `matches` cap was applied.',
    })

    t.nonNull.list.nonNull.field('matches', {
      type: AutInspectDomMatch,
      description: 'Up to 20 matches, in document order.',
    })
  },
})
