import { inputObjectType, objectType } from 'nexus'

export const Cohort = objectType({
  name: 'Cohort',
  description: 'used to distinguish one group of users from another',
  definition (t) {
    t.string('id')
    t.string('name')
  },
})
