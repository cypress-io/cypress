import { objectType } from 'nexus'

export const RelevantRun = objectType({
  name: 'RelevantRun',
  description: 'Indicates builds from the Cypress Cloud that most closely align with the current local Git commit',
  definition (t) {
    t.int('current', {
      description: 'Run number that is the most recent build that is not a RUNNING status',
    })

    t.int('next', {
      description: 'Run number that is the most recent build regardless of status ',
    })

    t.int('commitsAhead', {
      description: 'How many commits ahead the current local commit is from the commit of the current run',
    })
  },
})
