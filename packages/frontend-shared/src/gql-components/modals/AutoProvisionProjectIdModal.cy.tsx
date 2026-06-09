// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import AutoProvisionProjectIdModal from './AutoProvisionProjectIdModal.vue'

describe('<AutoProvisionProjectIdModal />', () => {
  const projectId = 'my-project-slug'
  const configFilePath = '/path/to/cypress.config.ts'

  function mountModal (onClose?: () => void) {
    cy.mount(() => (
      <div class="h-screen">
        <AutoProvisionProjectIdModal
          projectId={projectId}
          configFilePath={configFilePath}
          onClose={onClose}
        />
      </div>
    ))
  }

  it('renders project ID and links to project ID docs', () => {
    mountModal()

    cy.contains(defaultMessages.runs.connect.modal.autoProvision.title).should('be.visible')
    cy.contains(defaultMessages.runs.connect.modal.autoProvision.body).should('be.visible')
    cy.contains(`projectId: '${projectId}',`).should('be.visible')
    cy.get('[data-cy="external"]')
    .should('have.attr', 'href', 'https://on.cypress.io/what-is-a-project-id')
  })

  it('emits close when the footer close button is clicked', () => {
    const onClose = cy.stub().as('closeStub')

    mountModal(onClose)

    cy.contains('button', defaultMessages.runs.connect.modal.autoProvision.close).click()
    cy.get('@closeStub').should('have.been.calledOnce')
  })
})
