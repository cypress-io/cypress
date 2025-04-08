import NoInternetConnection from './NoInternetConnection.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<NoInternetConnection />', () => {
  it('renders expected contents', { viewportHeight: 300, viewportWidth: 300 }, () => {
    cy.log('Mount with no slot content')
    cy.mount(() => <NoInternetConnection />)
    cy.contains(defaultMessages.launchpadErrors.noInternet.header).should('be.visible')

    // icon should render but be hidden from screen readers
    cy.get('[data-cy="no-connection-icon"]')
    .should('be.visible')
    .and('have.attr', 'aria-hidden')

    cy.log('Mount with slot content')
    cy.mount(() => <NoInternetConnection> Extra Text </NoInternetConnection>)
    cy.contains('Extra Text').should('be.visible')
  })
})
