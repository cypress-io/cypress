// Custom command registrations last for the whole spec file, so replacing the
// built-in `getByRole` lives in its own file to keep it out of other specs.
describe('src/cy/commands/querying/get_by_role replaced by a project', () => {
  beforeEach(() => {
    cy.visit('/fixtures/a11y/roles.html')
  })

  it('lets Cypress.Commands.add() replace the built-in getByRole', () => {
    Cypress.Commands.add('getByRole', (role: string) => {
      return cy.get(`[data-custom-role="${role}"]`)
    })

    cy.get('main').invoke('append', '<span id="custom" data-custom-role="banner">Custom</span>')
    cy.getByRole('banner').should('have.id', 'custom')
  })

  it('lets Cypress.Commands.addQuery() replace the built-in getByRole', () => {
    Cypress.Commands.addQuery('getByRole', (role: string) => {
      return () => cy.$$(`[data-custom-query-role="${role}"]`)
    })

    cy.get('main').invoke('append', '<span id="custom-query" data-custom-query-role="banner">Custom</span>')
    cy.getByRole('banner').should('have.id', 'custom-query')
  })

  it('still throws when adding a command over another built-in', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('`get` is an existing Cypress command')

      done()
    })

    Cypress.Commands.add('get', () => {})
  })
})
