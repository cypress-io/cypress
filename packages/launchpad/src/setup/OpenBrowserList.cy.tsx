import { OpenBrowserListFragmentDoc } from '../generated/graphql-test'
import OpenBrowserList from './OpenBrowserList.vue'
import { longBrowsersList } from '@packages/frontend-shared/cypress/support/mock-graphql/longBrowsersList'
import { defaultMessages } from '@cy/i18n'

// Testing Note: because state for this component is maintained on the server and updated via gql mutations,
// this component test can't do interactions that change the chosen browser at the moment. Interactions and states
// are covered in the choose-a-browser.cy.ts e2e tests.

describe('<OpenBrowserList />', () => {
  beforeEach(() => {
    cy.viewport(1000, 750)
  })

  it('renders a long list of found browsers correctly', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      onResult: (result) => {
        result.currentBrowser = null
      },
      render: (gqlVal) => <div class="border-current border-1 resize overflow-auto"><OpenBrowserList gql={gqlVal} isBrowserOpen={false} isBrowserOpening={false}/></div>,
    })

    longBrowsersList.forEach((browser) => {
      cy.contains('label', browser.displayName).should('be.visible')
    })

    // If no default value, should choose electron
    cy.get('[data-cy-browser="electron"]').should('have.attr', 'aria-checked', 'true')
    cy.get('[data-cy="launch-button"]').contains(defaultMessages.openBrowser.startE2E.replace('{browser}', 'Electron'))
    cy.get('[data-cy="launch-button"]').get('[data-cy="e2e-testing-icon"]')

    cy.percySnapshot()
  })

  it('emits navigates back', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      render: (gqlVal) => (
        <div class="border-current border-1 resize overflow-auto">
          <OpenBrowserList
            gql={gqlVal}
            isBrowserOpen={false}
            isBrowserOpening={false}
            onNavigated-back={cy.stub().as('navigatedBack')}/>
        </div>),
    })

    cy.contains('button', 'Switch testing type').click()
    cy.get('@navigatedBack').should('have.been.called')
  })

  it('shows browser is opening', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      render: (gqlVal) => (
        <div class="border-current border-1 resize overflow-auto">
          <OpenBrowserList
            gql={gqlVal}
            isBrowserOpen={false}
            isBrowserOpening={true}/>
        </div>),
    })

    cy.get('[data-cy-browser]').each((browser) => cy.wrap(browser).should('have.attr', 'aria-disabled', 'true'))
    cy.get('[data-cy="launch-button"]').should('not.exist')
    cy.contains('button', defaultMessages.openBrowser.openingE2E.replace('{browser}', 'Electron')).should('be.disabled')

    cy.percySnapshot()
  })

  it('shows browser is open', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      render: (gqlVal) => (
        <div class="border-current border-1 resize overflow-auto">
          <OpenBrowserList
            gql={gqlVal}
            isBrowserOpen={true}
            isBrowserOpening={false}
            onClose-browser={cy.stub().as('closeBrowser')}/>
        </div>),
    })

    cy.get('[data-cy-browser]').each((browser) => cy.wrap(browser).should('have.attr', 'aria-disabled', 'true'))
    cy.contains('button', defaultMessages.openBrowser.running.replace('{browser}', 'Electron')).should('be.disabled')
    cy.contains('button', defaultMessages.openBrowser.focus)
    cy.contains('button', defaultMessages.openBrowser.close).click()
    cy.get('@closeBrowser').should('have.been.called')

    cy.percySnapshot()
  })

  it('hides focus button when unsupported', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      onResult: (result) => {
        result.currentBrowser = longBrowsersList.find((browser) => !browser.isFocusSupported) || null
      },
      render: (gqlVal) => (
        <div class="border-current border-1 resize overflow-auto">
          <OpenBrowserList
            gql={gqlVal}
            isBrowserOpen={true}
            isBrowserOpening={false}
            onClose-browser={cy.stub().as('closeBrowser')}/>
        </div>),
    })

    cy.get('[data-cy-browser]').each((browser) => cy.wrap(browser).should('have.attr', 'aria-disabled', 'true'))
    cy.contains('button', defaultMessages.openBrowser.running.replace('{browser}', 'Electron')).should('be.disabled')
    cy.contains('button', defaultMessages.openBrowser.focus).should('not.exist')
    cy.contains('button', defaultMessages.openBrowser.close).click()
    cy.get('@closeBrowser').should('have.been.called')

    cy.percySnapshot()
  })
})
