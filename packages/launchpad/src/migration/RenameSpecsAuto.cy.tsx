import { defaultMessages } from '@cy/i18n'
import { RenameSpecsAutoFragmentDoc } from '../generated/graphql-test'
import RenameSpecsAuto from './RenameSpecsAuto.vue'

describe('<RenameSpecsAuto/>', { viewportWidth: 1119 }, () => {
  it('renders the title', () => {
    cy.mountFragment(RenameSpecsAutoFragmentDoc, {
      render (gql) {
        return (<div class="p-16px">
          <RenameSpecsAuto gql={gql} />
        </div>)
      },
    })

    cy.contains(defaultMessages.migration.renameAuto.title).should('be.visible')
  })

  it('renders the change link', () => {
    cy.mountFragment(RenameSpecsAutoFragmentDoc, {
      render (gql) {
        return (<div class="p-16px">
          <RenameSpecsAuto gql={gql} />
        </div>)
      },
    })

    cy.findByText(defaultMessages.migration.renameAuto.changeButton).should('be.visible')
  })

  it('changes the skip status when proceeding to change', () => {
    cy.mountFragment(RenameSpecsAutoFragmentDoc, {
      render (gql) {
        return (<div class="p-16px">
          <RenameSpecsAuto gql={gql} />
        </div>)
      },
    })

    cy.findByText(defaultMessages.migration.renameAuto.optedOutMessage).should('not.exist')
    cy.findByText(defaultMessages.migration.renameAuto.changeButton).click()
    cy.findByText(defaultMessages.migration.renameAuto.modals.step1.buttonProceed).click()
    cy.findByText(defaultMessages.migration.renameAuto.modals.step2.option2).click()
    cy.findByText(defaultMessages.migration.renameAuto.modals.step2.buttonSave).click()
    cy.findByText(defaultMessages.migration.renameAuto.optedOutMessage).should('be.visible')
  })
})
