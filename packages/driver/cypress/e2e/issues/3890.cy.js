// @see https://github.com/cypress-io/cypress/issues/3890
const { $ } = Cypress

describe('issue 3890 overwriting cy.intercept command', () => {
  beforeEach(function () {
    cy
    .visit('/fixtures/jquery.html')
    .then(function (win) {
      const h = $(win.document.head)

      h.find('script').remove()
    })
  })

  it('stores intercept as an alias', () => {
    // sanity test before overwriting cy.intercept in the next test
    cy
    .intercept(/foo/, { body: 'my value' }).as('getFoo')
    .window().then((win) => {
      win.$.get('foo')

      return null
    })
    .wait('@getFoo').its('response.body').should('equal', 'my value')
  })

  it('stores intercept as an alias after overwrite', () => {
    let routeCalled

    Cypress.Commands.overwrite('intercept', (route, ...args) => {
      routeCalled = true

      return cy.log(`cy.intercept ${args.join(' ')}`)
      .then(() => {
        return route(...args)
      })
    })

    cy
    .intercept(/foo/, { body: 'my value' }).as('getFoo')
    .window().then((win) => {
      win.$.get('foo')

      return null
    })
    .wait('@getFoo').its('response.body').should('equal', 'my value')
    .then(() => {
      expect(routeCalled, 'route overwrite was called').to.be.true
    })
  })
})
