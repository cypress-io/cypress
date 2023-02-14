import StudioSaveModal from './StudioSaveModal.vue'
import { useStudioStore } from '../../store/studio-store'

describe('StudioSaveModal', () => {
  it('renders hidden by default', () => {
    cy.mount(<StudioSaveModal open={false} />)
    cy.findByTestId('studio-save-modal').should('not.exist')
  })

  it('renders open with props', () => {
    cy.mount(<StudioSaveModal open />)
    cy.findByTestId('studio-save-modal').should('be.visible')
    cy.percySnapshot()
  })

  it('submits the form', () => {
    const studioStore = useStudioStore()

    const saveStub = cy.stub(studioStore, 'save')

    cy.mount(<StudioSaveModal open />)
    cy.get('#testName').focus().type('my test')

    cy.findByRole('button', { name: 'Save' }).click().then(() => {
      expect(saveStub).to.be.calledOnceWith('my test')
    })
  })
})
