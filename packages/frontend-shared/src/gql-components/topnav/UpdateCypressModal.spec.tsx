import UpdateCypressModal from './UpdateCypressModal.vue'
import { defaultMessages } from '@cy/i18n'

describe('<UpdateCypressModal />', { viewportWidth: 1000, viewportHeight: 750 }, () => {
  it('renders expected content & emits expected events', () => {
    const installedVersion = '8.2.0'
    const latestVersion = '10.0.0'

    cy.mount(UpdateCypressModal, {
      props: {
        installedVersion,
        latestVersion,
        show: true,
      },
    })

    cy.contains(`${defaultMessages.topNav.updateCypress.title} ${latestVersion}`).should('be.visible')
    cy.contains(`${defaultMessages.topNav.updateCypress.currentlyRunning}`.replace('{0}', installedVersion)).should('be.visible')
    cy.contains(`${defaultMessages.topNav.updateCypress.pasteToUpgrade}`).should('be.visible')
    cy.contains(`cypress@${latestVersion}`).should('be.visible')
    cy.contains('Remember to close').should('be.visible')
    cy.findByLabelText('Close').click().then(() => {
      cy.wrap(Cypress.vueWrapper.emitted('close')?.[0])
      .should('deep.equal', [])
    })
  })
})
