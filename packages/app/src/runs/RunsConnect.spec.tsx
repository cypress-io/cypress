import RunsConnect from './RunsConnect.vue'

describe('<RunsConnect />', () => {
  it('playground', () => {
    cy.mount(<RunsConnect isLoggedIn={false} />)
  })

  it('show user connect if not connected', () => {
    cy.mount(<RunsConnect isLoggedIn={false} />)
    cy.contains('button', 'Log in').should('be.visible')
  })

  it('show project connect if not connected', () => {
    cy.mount(<RunsConnect isLoggedIn={true} />)
    cy.contains('button', 'Connect your project').should('be.visible')
  })
})
