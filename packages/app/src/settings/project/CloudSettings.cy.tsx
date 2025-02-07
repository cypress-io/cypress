// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { CloudSettingsFragmentDoc } from '../../generated/graphql-test'
import CloudSettings from './CloudSettings.vue'

describe('<CloudSettings />', () => {
  it('displays the project Id and Record Key sections', () => {
    cy.mountFragment(CloudSettingsFragmentDoc, {

      render: (gqlVal) => {
        return (
          <div class="py-4 px-8 children:py-[24px]">
            <CloudSettings gql={gqlVal}/>
          </div>
        )
      },
    })

    cy.findByText(defaultMessages.settingsPage.projectId.title).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.recordKey.title).should('be.visible')

    cy.percySnapshot()
  })

  it('shows connect button when projectId is not present', () => {
    cy.mountFragment(CloudSettingsFragmentDoc, {
      onResult (ctx) {
        if (ctx.currentProject?.cloudProject?.__typename === 'CloudProject') {
          ctx.currentProject.projectId = null
          ctx.currentProject.cloudProject.recordKeys = []
        }
      },
      render: (gqlVal) => {
        return (
          <div class="py-4 px-8 children:py-[24px]">
            <CloudSettings gql={gqlVal}/>
          </div>
        )
      },
    })

    cy.findByText(defaultMessages.settingsPage.projectId.title).should('not.exist')
    cy.findByText(defaultMessages.runs.connect.buttonUser).should('be.visible')
    cy.findByText(defaultMessages.settingsPage.recordKey.title).should('not.exist')
  })

  it('hides Record Key when not present', () => {
    cy.mountFragment(CloudSettingsFragmentDoc, {
      onResult (ctx) {
        if (ctx.currentProject?.cloudProject?.__typename === 'CloudProject') {
          ctx.currentProject.projectId = null
          ctx.currentProject.cloudProject.recordKeys = []
        }
      },
      render: (gqlVal) => {
        return (
          <div class="py-4 px-8 children:py-[24px]">
            <CloudSettings gql={gqlVal}/>
          </div>
        )
      },
    })

    cy.findByText(defaultMessages.settingsPage.recordKey.title).should('not.exist')

    cy.get('button').contains('Connect to Cypress Cloud')
  })
})
