// Isolation spike, dialog probes. Kept apart because a real (unstubbed) dialog
// can block the AUT and hang the rest of the run.
type Go = () => void

const goSameOrigin: Go = () => {
  cy.visit('/fixtures/remote-driver-isolation.html')
}

const goCrossOrigin: Go = () => {
  cy.visit('/fixtures/remote-driver.html')
  cy.get('#isolation-link').click()
  cy.get('#page').should('have.text', '1')
}

const probes = (go: Go) => {
  it('alert is auto-accepted and reaches window:alert', () => {
    const alerts: string[] = []

    cy.on('window:alert', (text) => {
      alerts.push(text)
    })

    go()
    cy.get('#alert').click()
    cy.get('#dialog-result').should('have.text', 'alerted')
    cy.wrap(alerts).should('deep.equal', ['app alert'])
  })

  it('window:confirm can answer the confirm', () => {
    cy.on('window:confirm', () => false)

    go()
    cy.get('#confirm').click()
    cy.get('#dialog-result').should('have.text', 'confirmed:false')
  })
}

describe('isolation spike: dialogs', { browser: { family: 'chromium' }, defaultCommandTimeout: 2000 }, () => {
  describe('legacy driver, same-origin', { experimentalRemoteDriver: false }, () => probes(goSameOrigin))

  describe('remote driver, same-origin', { experimentalRemoteDriver: true }, () => probes(goSameOrigin))

  describe('remote driver, cross-origin', { experimentalRemoteDriver: true }, () => probes(goCrossOrigin))
})

export {}
