import ProjectSettings from './ProjectSettings.vue'

describe('<ProjectSettings />', () => {
  beforeEach(() => {
    cy.mount(() => (
      <div class="py-4 px-8">
        <ProjectSettings/>
      </div>
    ))
  })

  it('displays the project, record key, and experiments sections', () => {
    cy.findByText('Project ID').should('be.visible')
    cy.findByText('Record Key').should('be.visible')
    cy.findByText('Experiments').should('be.visible')
  })
})
