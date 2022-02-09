describe('stdout_passing_spec', () => {
  context('file', () => {
    it('visits file', () => {
      cy.visit('/index.html')
    })
  })

  context('google', () => {
    it('visits google', () => {
      cy.visit('https://www.google.com:1777')
    })

    it('google2', () => {})
  })

  context('apple', () => {
    it('apple1', () => {})

    it('visits apple', () => {
      cy.visit('https://www.apple.com:1777')
    })
  })

  context('subdomains', () => {
    it('cypress1', () => {})

    it('visits cypress', () => {
      cy.visit('https://www.cypress.io:1777')
      cy.visit('https://docs.cypress.io:1777')
    })

    it('cypress3', () => {})
  })
})
