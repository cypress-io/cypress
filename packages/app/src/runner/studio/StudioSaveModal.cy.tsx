import StudioSaveModal from './StudioSaveModal.vue'

describe('StudioSaveModal', () => {
  it('renders hidden by default', () => {
    cy.mount(<StudioSaveModal studioStore={{}} open={false} />)
    cy.findByTestId('studio-save-modal').should('not.exist')
  })

  it('renders open with props', () => {
    cy.mount(<StudioSaveModal studioStore={{}} open />)
    cy.findByTestId('studio-save-modal').should('be.visible')
    cy.percySnapshot()
  })

  it('submits the form', () => {
    const save = cy.stub()

    cy.mount(<StudioSaveModal studioStore={{ save }} open />)
    cy.get('#testName').focus().type('my test')

    cy.findByText('Save Test').click().then(() => {
      expect(save).to.be.calledOnceWith('my test')
    })
  })
})
