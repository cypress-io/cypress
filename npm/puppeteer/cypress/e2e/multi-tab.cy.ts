describe('multi-tab testing', () => {
  it('switches to a new tab', () => {
    cy.visit('/cypress/fixtures/page-1.html')
    cy.get('input').type('Hello from Page 1')
    cy.get('button').click() // Triggers a new tab to open

    cy
    .puppeteer('switchToTabAndGetContent')
    .should('equal', 'You said: Hello from Page 1')
  })

  it('creates a new tab', () => {
    cy.visit('/cypress/fixtures/page-3.html')
    // We get a dynamic value from the page and pass it through to the puppeteer
    // message handler
    cy.get('#message').invoke('text').then((message) => {
      cy
      .puppeteer('createTabAndGetContent', message)
      .should('equal', 'I approve this message: Cypress and Puppeteer make a great combo')
    })
  })
})
