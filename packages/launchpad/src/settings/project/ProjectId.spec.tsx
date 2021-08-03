import { ref } from 'vue'
import ProjectId from './ProjectId.vue'

describe('<ProjectId />', () => {
  beforeEach(() => {
    cy.viewport(800, 600)
  })

  it('renders the project ID in the input field', () => {
    const copied = ref('')
    const useClipboard = () => ({
      copy: () => {
        copied.value = 'Copied!'
      },
      copied,
    })

    cy.mount(() => (
      <div class="py-4 px-8">
        <ProjectId mockClipboard={useClipboard} />
      </div>
    ))

    cy.findByText('projectId').should('be.visible')
    cy.findByText('Copy')
    .click()
    .findByText('Copy')
    .should('not.exist')
    .findByText('Copied!')
    .should('be.visible')
  })
})
