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
      render: (gqlVal) =>
        (<div class="border-current border resize overflow-auto">
          <OpenBrowserList gql={gqlVal}/>
        </div>),
    })

    longBrowsersList.forEach((browser) => {
      cy.contains('label', browser.displayName).should('be.visible')
    })

    // Firefox early version should be disabled
    cy.get('[data-cy-browser="firefox"]').should('have.attr', 'aria-disabled', 'true')
    cy.get('[data-cy-browser="firefox"] [data-cy="unsupported-browser-tooltip-trigger"]').should('exist')
    cy.get('[data-cy-browser="electron"] [data-cy="unsupported-browser-tooltip-trigger"]').should('not.exist')

    // Renders a default logo if we don't provide one
    cy.get('[data-cy-browser="fake"]').should('have.attr', 'aria-disabled', 'true')
    cy.get('[data-cy-browser="fake"] img').should('have.attr', 'src').should('include', 'generic-browser')

    cy.percySnapshot()
  })

  it('displays a tooltip for an unsupported browser', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      render: (gqlVal) =>
        (<div class="border-current border resize overflow-auto">
          <div class="h-40" />
          <OpenBrowserList gql={gqlVal}/>
        </div>),
    })

    cy.get('[data-cy-browser="firefox"]:nth(2) [data-cy="unsupported-browser-tooltip-trigger"]')
    .trigger('mouseenter')

    cy.get('.v-popper__popper--shown')
    .contains('Cypress does not support running Firefox Developer Edition version 69.')

    /*
      TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23436
      cy.percySnapshot()
    */
  })

  it('emits navigates back', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      render: (gqlVal) => (
        <div class="border-current border resize overflow-auto">
          <OpenBrowserList
            gql={gqlVal}
            onNavigatedBack={cy.stub().as('navigatedBack')}/>
        </div>),
    })

    cy.contains('button', 'Switch testing type').click()
    cy.get('@navigatedBack').should('have.been.called')
  })

  it('shows browser is opening', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      onResult: (res) => {
        res.browserStatus = 'opening'
      },
      render: (gqlVal) => (
        <div class="border-current border resize overflow-auto">
          <OpenBrowserList
            gql={gqlVal} />
        </div>),
    })

    cy.get('[data-cy-browser]').each((browser) => cy.wrap(browser).should('have.attr', 'aria-disabled', 'true'))
    cy.get('[data-cy="launch-button"]').should('not.exist')
    cy.contains('button', defaultMessages.openBrowser.openingE2E.replace('{browser}', 'Electron')).should('be.disabled')
  })

  it('shows browser is open', () => {
    cy.mountFragment(OpenBrowserListFragmentDoc, {
      onResult: (res) => {
        res.browserStatus = 'open'
      },
      render: (gqlVal) => (
        <div class="border-current border resize overflow-auto">
          <OpenBrowserList
            gql={gqlVal}
            onCloseBrowser={cy.stub().as('closeBrowser')}/>
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
      onResult: (res) => {
        res.browserStatus = 'open'
        res.activeBrowser!.isFocusSupported = false
      },
      render: (gqlVal) => {
        return (
          <div class="border-current border resize overflow-auto">
            <OpenBrowserList
              gql={gqlVal}
              onCloseBrowser={cy.stub().as('closeBrowser')}/>
          </div>)
      },
    })

    cy.contains('button', defaultMessages.openBrowser.running.replace('{browser}', 'Electron')).should('be.disabled')
    cy.contains('button', defaultMessages.openBrowser.focus).should('not.exist')
  })

  // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23099
  it('throws when activeBrowser is null', { retries: 15 }, (done) => {
    cy.once('uncaught:exception', (err) => {
      expect(err.message).to.include('Missing activeBrowser in selectedBrowserId')
      done()
    })

    cy.mountFragment(OpenBrowserListFragmentDoc, {
      onResult: (res) => {
        res.activeBrowser = null
      },
      render: (gqlVal) => {
        return (
          <div class="border-current border resize overflow-auto">
            <OpenBrowserList
              gql={gqlVal}
              onCloseBrowser={cy.stub().as('closeBrowser')}/>
          </div>)
      },
    })
  })
})
