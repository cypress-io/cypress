let GQL_PORT

describe('Launchpad', () => {
  before(() => {
    cy.task('getGraphQLPort').then((port) => {
      GQL_PORT = port
    })
  })

  it('resolves the home page', () => {
    cy.visit(`dist/index.html?serverPort=${GQL_PORT}`)
    cy.get('h1').should('contain', 'Welcome')
  })
})
