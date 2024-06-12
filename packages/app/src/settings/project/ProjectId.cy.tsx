import { set } from 'lodash'
import { ProjectIdFragmentDoc } from '../../generated/graphql-test'
import ProjectId from './ProjectId.vue'

describe('<ProjectId />', () => {
  beforeEach(() => {
    cy.viewport(1000, 600)
  })

  it('renders the project ID in the input field', () => {
    const givenProjectId = 'aaaa-bbbb-cccc-dddd'

    cy.mountFragment(ProjectIdFragmentDoc, {
      onResult: (result) => {
        set(result, 'currentProject.projectId', givenProjectId)
      },
      render: (gqlVal) => (
        <div class="py-4 px-8">
          <ProjectId
            gql={gqlVal}
          />
        </div>
      ),
    })

    cy.findByText(givenProjectId).should('be.visible')
    cy.findByText('Copy')
  })
})
