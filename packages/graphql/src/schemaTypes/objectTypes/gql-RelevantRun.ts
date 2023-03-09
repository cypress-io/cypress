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

export const RelevantRunSpecs = objectType({
  name: 'RelevantRunSpecs',
  description: '',
  definition (t) {
    t.nonNull.int('runNumber', {
      description: 'The runNumber that these spec counts belong to',
    })

    t.nonNull.int('totalSpecs', {
      description: 'Total number of specs in the run',
    })

    t.nonNull.int('completedSpecs', {
      description: 'Number of specs in the run that have finished being processed',
    })

    t.dateTime('scheduledToCompleteAt', {
      description: 'Copy of CloudRun.scheduledToCompleteAt',
    })
  },
})
