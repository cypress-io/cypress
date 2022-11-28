// @see https://github.com/cypress-io/cypress/issues/3890
const { $ } = Cypress

describe('issue 3890 overwriting cy.route command', () => {
  beforeEach(function () {
    cy
    .visit('/fixtures/jquery.html')
    .then(function (win) {
      const h = $(win.document.head)

      h.find('script').remove()
    })
  })

  it('stores route as an alias', () => {
    // sanity test before overwriting cy.route in the next test
    cy
    .server()
    .route(/foo/, 'my value').as('getFoo')
    .window().then((win) => {
      win.$.get('foo')

      return null
    })
    .wait('@getFoo').its('responseBody').should('equal', 'my value')
  })

  it('stores route as an alias after overwrite', () => {
    let routeCalled

    Cypress.Commands.overwrite('route', (route, ...args) => {
      routeCalled = true

      return cy.log(`cy.route ${args.join(' ')}`)
      .then(() => {
        return route(...args)
      })
    })

    cy
    .server()
    .route(/foo/, 'my value').as('getFoo')
    .window().then((win) => {
      win.$.get('foo')

      return null
    })
    .wait('@getFoo').its('responseBody').should('equal', 'my value')
    .then(() => {
      expect(routeCalled, 'route overwrite was called').to.be.true
    })
  })
})
