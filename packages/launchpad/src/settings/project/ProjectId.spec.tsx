import { computed, ref } from 'vue'
import { ProjectIdFragmentDoc } from '../../generated/graphql-test'
import ProjectId from './ProjectId.vue'

describe('<ProjectId />', () => {
  beforeEach(() => {
    cy.viewport(800, 600)
  })

  const copied = ref('')
  const useClipboard = () => ({
    copy: () => {
      copied.value = 'Copied'
    },
    copied,
    text: computed(() => ''),
    isSupported: true,
  })

  it('renders the project ID in the input field', () => {
    cy.mountFragment(ProjectIdFragmentDoc, {
      type: (ctx) => {
        return ctx.cypressProjects.activeProject
      },
      render: (gqlVal) => (
        <div class="py-4 px-8">
          <ProjectId
            mockClipboard={useClipboard}
            gql={gqlVal}
          />
        </div>
      ),
    }).then(() => {
      cy.findByText('projectId').should('be.visible')
      cy.findByText('Copy')
      .click()
      .findByText('Copy')
      .should('not.exist')
      .findByText('Copied')
      .should('be.visible')
    })
  })
})
