import { OpenBrowserListFragmentDoc } from '../generated/graphql'
import OpenBrowserList from './OpenBrowserList.vue'
import longBrowserList from '../../cypress/fixtures/browsers/long-list.json'

const launchButtonSelector = 'button[data-testid=launch-button]'

describe('<OpenBrowserList />', () => {
  it('renders a long list of found browsers correctly', () => {
    cy.viewport(1000, 750)
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      type: (ctx) => {
        ctx.app.setBrowsers(longBrowserList)

        return ctx.app
      },
      render: (gqlVal) => <div class="resize overflow-auto border-current border-1"><OpenBrowserList gql={gqlVal} /></div>,
    })

    longBrowserList.forEach((browser) => {
      cy.contains('label', browser.displayName).should('be.visible')
    })

    cy.get(launchButtonSelector).should('be.visible').and('have.text', 'Launch Electron')
    cy.contains('label', 'Canary').click()
    cy.get(launchButtonSelector).should('be.visible').and('have.text', 'Launch Canary')

    cy.contains('button', 'different browser').should('not.exist')
  })
})
