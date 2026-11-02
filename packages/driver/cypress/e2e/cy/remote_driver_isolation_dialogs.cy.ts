// Kept apart because a real (unanswered) dialog can block the AUT and hang the rest of the run.
type Go = () => void

const goBaseUrl: Go = () => {
  cy.visit('/fixtures/remote-driver-isolation.html')
}

const goOtherSite: Go = () => {
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

  it('a window:confirm handler can\'t refuse the confirm', () => {
    const confirms: string[] = []

    cy.on('window:confirm', (text) => {
      confirms.push(text)

      return false
    })

    go()
    cy.get('#confirm').click()
    cy.get('#dialog-result').should('have.text', 'confirmed:true')
    cy.wrap(confirms).should('deep.equal', ['app confirm'])
  })

  it('a stubbed confirm answers it', () => {
    go()
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(false)
    })

    cy.get('#confirm').click()
    cy.get('#dialog-result').should('have.text', 'confirmed:false')
  })
}

describe('remote driver isolation: dialogs', () => {
  describe('AUT on baseUrl', () => probes(goBaseUrl))

  describe('AUT on another site', () => probes(goOtherSite))
})

export {}
