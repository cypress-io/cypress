import ProjectId from './ProjectId.vue'

describe('<ProjectId />', () => {
  beforeEach(() => {
    cy.viewport(800, 600)
    cy.mount(() => (
      <div class="py-4 px-8">
        <ProjectId/>
      </div>
    ))
  })

  it('renders the project ID in the input field', () => {
    cy.findByText('projectId').should('be.visible')
    cy.findByText('Copy')
    .click()
    .findByText('Copy')
    .should('not.exist')
    .findByText('Copied!')
    .should('be.visible')
  })
})
