import UpdateCypressModal from './UpdateCypressModal.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

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

    cy.contains(`${defaultMessages.topNav.updateCypress.title} ${latestVersion}`).should('be.visible')
    cy.contains(defaultMessages.topNav.updateCypress.currentlyRunning
    .replace('{0}', installedVersion)).should('be.visible')

    cy.contains(defaultMessages.topNav.updateCypress.pasteToUpgradeGlobal
    .replace('{0}', defaultMessages.topNav.updateCypress.rememberToCloseInsert)).should('be.visible')

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

    cy.contains(defaultMessages.topNav.updateCypress.pasteToUpgradeProject
    .replace('{0}', defaultMessages.topNav.updateCypress.rememberToCloseInsert)).should('be.visible')
  })
})
