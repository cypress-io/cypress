import { objectType } from 'nexus'

export const RelevantRun = objectType({
  name: 'RelevantRun',
  description: '',
  definition (t) {
    t.int('current', {
      description: '',
    })

    t.int('next', {
      description: '',
    })
  },
})
