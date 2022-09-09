import { inputObjectType, objectType } from 'nexus'

export const Cohort = objectType({
  name: 'Cohort',
  description: 'used to distinguish one group of users from another',
  definition (t) {
    t.string('name', { description: 'name used to identify the cohort topic (e.g. "LoginBanner" ) ' })
    t.string('cohort', { description: 'value used to identify the indicate the cohort (e.g. "A" or "B")' })
  },
})
