describe('src/cy/commands/prompt', () => {
  afterEach(() => {
    Cypress.testingType = 'e2e'
  })

  // TODO: (cy.prompt) We will look into supporting other browsers
  // as this is rolled out. We will add error messages for other browsers
  // and add tests if necessary
  if (!Cypress.isBrowser('webkit') && !Cypress.isBrowser('firefox')) {
    it('executes the prompt command', () => {
      cy.env(['CI', 'RECORD_KEY']).then(({ CI, RECORD_KEY }) => {
        const contributorPr = CI && !RECORD_KEY && Cypress.config('isTextTerminal')

        if (contributorPr) {
          cy.on('fail', (err) => {
            expect(err.message).to.include('Record key not provided')
          })

          cy.visit('http://www.foobar.com:3500/fixtures/prompt.html')
          cy.prompt(['Click the "click me" button'])
        } else {
          cy.visit('http://www.foobar.com:3500/fixtures/prompt.html')
          cy.prompt(['Click the "click me" button'])
          cy.get('#log').should('contain', 'clicked')
        }
      })
    })
  }

  it('fails when testingType is component', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.eq('`cy.prompt` is currently only supported in end-to-end tests.')
      done()
    })

    Cypress.testingType = 'component'

    cy.visit('http://www.foobar.com:3500/fixtures/prompt.html')

    cy.prompt(['Click the "click me" button'])
  })
})
