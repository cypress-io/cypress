import type { MigrationStep } from '@packages/frontend-shared/cypress/support/generated/test-graphql-types.gen'
import { MigrationWizard_RenameSpecsDocument } from '../generated/graphql-test'
import MigrationWizard from './MigrationWizard.vue'

describe('<MigrationWizard />', { viewportWidth: 1280, viewportHeight: 1000 }, () => {
  it('outline focus should highlight current step block', () => {
    cy.stubMutationResolver(MigrationWizard_RenameSpecsDocument, (defineResult) => {
      const filteredSteps = cy.gqlStub.Migration.filteredSteps as MigrationStep[]

      filteredSteps[0].isCompleted = true
      filteredSteps[0].isCurrentStep = false
      filteredSteps[1].isCurrentStep = true

      return defineResult({
        migrateRenameSpecs: {
          baseError: null,
          migration: {
            filteredSteps,
          },
          __typename: 'Query',
        },
      })
    })

    cy.mount(() => <MigrationWizard class='m-4' />)

    const button = cy.get('button').contains('Rename these specs for me')

    button.should('be.visible')

    cy.percySnapshot('1st step')

    button.click()

    cy.percySnapshot('moved to 2nd step')
  })
})
