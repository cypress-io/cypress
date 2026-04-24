import { objectType } from 'nexus'

export const StudioInitResponse = objectType({
  name: 'StudioInitResponse',
  description: 'Result of a studioInitTest mutation',
  definition (t) {
    t.nonNull.string('testId', {
      description: 'Runtime id of the test that was targeted',
    })
  },
})
