import { objectType } from 'nexus'
import { RunSpecResponseCodeEnum } from '../enumTypes'

export const RunSpecResponse = objectType({
  name: 'RunSpecResponse',
  description: 'Result of a runSpec mutation',
  definition (t) {
    t.nonNull.field('code', {
      type: RunSpecResponseCodeEnum,
    })

    t.string('testingType', {
      description: 'Testing Type that spec was launched in',
    })

    t.field('browser', {
      type: 'Browser',
      description: 'Browser test was launched in',
    })

    t.field('spec', {
      type: 'Spec',
      description: 'Matched spec that was launched',
    })

    t.string('detailMessage', {
      description: 'Contextual information for a given status (typically an expanded error message)',
    })
  },
})
