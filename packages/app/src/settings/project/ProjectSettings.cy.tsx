import { ProjectSettingsFragmentDoc } from '../../generated/graphql-test'
import ProjectSettings from './ProjectSettings.vue'

describe('<ProjectSettings />', () => {
  it('displays the project, record key, and experiments sections', () => {
    cy.mountFragment(ProjectSettingsFragmentDoc, {
      onResult (ctx) {
        if (ctx.currentProject?.cloudProject?.__typename === 'CloudProject') {
          ctx.currentProject.cloudProject.recordKeys = []
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

    cy.findByText('Project ID').should('be.visible')
    cy.get('div').contains('You don\'t have any record keys')
    cy.findByText('Experiments').should('be.visible')
  })
})
