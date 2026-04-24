import { objectType } from 'nexus'
import { AutInspectA11yNode } from './gql-AutInspectA11yNode'

export const AutInspectSnapshotResponse = objectType({
  name: 'AutInspectSnapshotResponse',
  description: 'Result of an `autInspectSnapshot` query: the AUT\'s URL/title/viewport plus a compact accessibility tree.',
  definition (t) {
    t.nonNull.string('url')
    t.string('title')
    t.nonNull.int('viewportWidth')
    t.nonNull.int('viewportHeight')
    t.nonNull.int('nodeCount', {
      description: 'Total number of accessibility nodes discovered, before the walker cap.',
    })

    t.nonNull.boolean('truncated', {
      description: 'True when the walker stopped early because the node cap (500) was hit.',
    })

    t.nonNull.field('tree', {
      type: AutInspectA11yNode,
      description: 'Root of the accessibility tree (role `document`).',
    })
  },
})
