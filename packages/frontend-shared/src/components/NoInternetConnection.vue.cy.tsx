import NoInternetConnection from './NoInternetConnection.vue'

describe('<NoInternetConnection />', () => {
  it('renders expected contents', { viewportHeight: 300, viewportWidth: 300 }, () => {
    cy.log('Mount with no slot content')
    cy.mount(() => <NoInternetConnection />)
    cy.contains('You have no internet connection').should('be.visible')

    // icon should render but be hidden from screen readers
    cy.get('[data-cy="no-connection-icon"]')
    .should('be.visible')
    .and('have.attr', 'aria-hidden')

    cy.log('Mount with slot content')
    cy.mount(() => <NoInternetConnection> Extra Text </NoInternetConnection>)
    cy.contains('Extra Text').should('be.visible')
  })
})
