import { objectType } from 'nexus'

export const RelevantRunInfo = objectType({
  name: 'RelevantRunInfo',
  description: 'runNumber and commitSha for a given run',
  definition (t) {
    t.nonNull.id('runId', {
      description: 'The run id',
    })

    t.nonNull.int('runNumber', {
      description: 'The runNumber that these spec counts belong to',
    })

    t.nonNull.string('sha', {
      description: 'sha associated with the run',
    })

    t.field('status', {
      type: 'CloudRunStatus',
      description: 'Status for run',
    })

    t.nonNull.int('totalFailed', {
      description: 'The total number of failed specs in the run.',
    })
  },
})

export const RelevantRun = objectType({
  name: 'RelevantRun',
  description: 'Indicates builds from the Cypress Cloud that most closely align with the current local Git commit',
  definition (t) {
    t.nonNull.list.nonNull.field('all', {
      type: RelevantRunInfo,
      description: 'All relevant runs to fetch for the debug page prior to the latest completed run',
    })

    t.nonNull.list.nonNull.field('latest', {
      type: RelevantRunInfo,
      description: 'Latest relevant runs to fetch for the specs and runs page',
    })

    t.nonNull.int('commitsAhead', {
      description: 'How many commits ahead the current local commit is from the commit of the current run',
    })

    t.int('selectedRunNumber', {
      description: 'Run number of the selected run in use on the Debug page',
    })

    t.field('currentCommitInfo', {
      type: objectType({
        name: 'CommitInfo',
        description: '',
        definition (t) {
          t.nonNull.string('sha', {
            description: 'Commit hash',
          })

          t.nonNull.string('message', {
            description: 'Commit message',
          })
        },
      }),
      description: 'Information about the current commit for the local project',
    })
  },
})
