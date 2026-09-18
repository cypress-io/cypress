// https://github.com/cypress-io/cypress/issues/3975
describe('page that redirects from an XHR onload handler', () => {
  it('lands on the redirected URL', () => {
    cy.visit('/fixtures/nested/3975_a.html')
    cy.get('h1').should('contain', 'Loaded')
    cy.url().should('include', 'b.html')
  })

  it('lands on the redirected URL across repeated visits', () => {
    cy.visit('/fixtures/nested/3975_a.html')
    cy.get('h1').should('contain', 'Loaded')
    cy.url().should('include', 'b.html')
    cy.visit('/fixtures/nested/3975_a.html')
    cy.get('h1').should('contain', 'Loaded')
    cy.url().should('include', 'b.html')
  })

  it('intercepts XHR onload and preserves window.event on about:blank', () => {
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
