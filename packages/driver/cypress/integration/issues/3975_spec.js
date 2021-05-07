describe('issue 3975 redirect bug', () => {
  it('should visit the correct url', () => {
    cy.visit('/fixtures/nested/3975_a.html')
    cy.get('h1').should('contain', 'Loaded')
    cy.url().should('include', 'b.html')
  })

  it('visits the correct URL across pageloads', () => {
    cy.visit('/fixtures/nested/3975_a.html')
    cy.get('h1').should('contain', 'Loaded')
    cy.url().should('include', 'b.html')
    cy.visit('/fixtures/nested/3975_a.html')
    cy.get('h1').should('contain', 'Loaded')
    cy.url().should('include', 'b.html')
  })

  it('works with about:blank', () => {
    const win = cy.state('window')
    const x = new win.XMLHttpRequest()

    function onloadFn (e) {
      if (x.onload === onloadFn) {
        throw new Error('onload not intercepted')
      }

      if (win.event !== e) {
        throw new Error('Wrong win.event')
      }
    }

    x.onload = onloadFn

    x.open('GET', '/fixtures/nested/3975_a.html')
    x.send()
  })
})
