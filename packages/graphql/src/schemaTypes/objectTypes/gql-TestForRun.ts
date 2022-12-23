import { objectType } from 'nexus'

export const TestForRun = objectType({
  name: 'TestForRun',
  description: '',
  definition (t) {
    t.nonNull.string('status')
    t.nonNull.string('titlePath')
  },
})
