import { defaultMessages } from '@cy/i18n'
import { ProjectSettingsFragmentDoc } from '../../generated/graphql-test'
import ProjectSettings from './ProjectSettings.vue'

describe('<ProjectSettings />', () => {
  it('displays the experiments section', () => {
    cy.mountFragment(ProjectSettingsFragmentDoc, {

      render: (gqlVal) => {
        return (
          <div class="py-4 px-8 children:py-24px">
            <ProjectSettings gql={gqlVal}/>
          </div>
        )
      },
    })

    cy.findByText(defaultMessages.settingsPage.experiments.title).should('be.visible')

    cy.percySnapshot()
  })

  it('hides project Id, and record key when not present', () => {
    cy.mountFragment(ProjectSettingsFragmentDoc, {
      onResult (ctx) {
        if (ctx.cloudProject?.__typename === 'CloudProject') {
          ctx.projectId = null
          ctx.cloudProject.recordKeys = []
        }
      },
      render: (gqlVal) => {
        return (
          <div class="py-4 px-8 children:py-24px">
            <ProjectSettings gql={gqlVal}/>
          </div>
        )
      },
    })

    cy.findByText(defaultMessages.settingsPage.projectId.title).should('not.exist')
    cy.findByText(defaultMessages.settingsPage.recordKey.title).should('not.exist')

    cy.percySnapshot()
  })
})
