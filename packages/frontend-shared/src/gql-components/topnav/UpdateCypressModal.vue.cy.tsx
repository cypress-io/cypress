import UpdateCypressModal from './UpdateCypressModal.vue'

describe('<UpdateCypressModal />', { viewportWidth: 1000, viewportHeight: 750 }, () => {
  const installedVersion = '8.2.0'
  const latestVersion = '10.0.0'

  it('renders expected content & emits expected events', () => {
    const handleClose = cy.stub()

    cy.mount(() => (<UpdateCypressModal
      installedVersion={installedVersion}
      latestVersion={latestVersion}
      show={true}
      onClose={handleClose}
      installCommand="npm i "/>))

    cy.contains(`Upgrade to Cypress ${latestVersion}`).should('be.visible')
    cy.contains(`You are currently running Version ${installedVersion} of Cypress. `).should('be.visible')

    cy.contains('To upgrade to the latest version, first close this app, then paste the command below into your terminal:').should('be.visible')

    cy.findByDisplayValue(`npm i cypress@${latestVersion}`).should('be.visible')
    cy.findByLabelText('Close').click().then(() => {
      expect(handleClose).to.have.been.calledOnce
    })
  })

  it('renders project-specific instructions when a project name prop is present', () => {
    cy.mount(() => (<UpdateCypressModal
      projectName="test-project"
      installedVersion={installedVersion}
      latestVersion={latestVersion}
      show={true}
      installCommand="npm i "/>))

    cy.contains('To upgrade to the latest version for your project, first close this app, then paste the command below into your terminal:').should('be.visible')
  })
})
