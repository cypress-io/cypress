import { ProjectSettingsFragmentDoc } from '../../generated/graphql-test'
import ProjectSettings from './ProjectSettings.vue'

describe('<ProjectSettings />', () => {
  it('displays the project, record key, and experiments sections', () => {
    cy.mountFragment(ProjectSettingsFragmentDoc, {
      render: (gqlVal) => {
        return (
          <div class="py-4 px-8">
            <ProjectSettings gql={gqlVal}/>
          </div>
        )
      },
    })

    // TODO: use `mountFragment` and supply record keys using ClientTestContext.
    cy.findByText('Project ID').should('be.visible')
    cy.findAllByTestId('preview').contains('projectId: \'test-project-id\'')
    cy.get('div').contains('You don\'t have any record keys')
    cy.findByText('Experiments').should('be.visible')
  })
})
