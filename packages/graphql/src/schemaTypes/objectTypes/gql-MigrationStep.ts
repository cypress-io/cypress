import { MIGRATION_STEPS } from '@packages/types'
import { enumType, objectType } from 'nexus'

export const MigrationStepEnum = enumType({
  name: 'MigrationStepEnum',
  members: MIGRATION_STEPS,
})

export const MigrationStep = objectType({
  name: 'MigrationStep',
  description: 'Contains all data related to the 9.X to 10.0 migration UI',
  definition (t) {
    t.nonNull.field('name', {
      type: MigrationStepEnum,
      description: 'Identifier of the step',
    })

    t.nonNull.boolean('isCurrentStep', {
      description: 'This is the current step',
      resolve: (source, args, ctx) => {
        return ctx.migration.step === source.name
      },
    })

    t.nonNull.boolean('isCompleted', {
      description: 'Has the current step been completed',
      resolve: (source, args, ctx) => {
        const indexOfCurrentStep = ctx.migration.filteredSteps.indexOf(ctx.migration.step) + 1

        return source.index < indexOfCurrentStep
      },
    })

    t.nonNull.int('index', {
      description: 'Index of the step in the list',
      resolve: (source, args, ctx) => {
        return ctx.migration.filteredSteps.indexOf(source.name) + 1
      },
    })
  },
})
