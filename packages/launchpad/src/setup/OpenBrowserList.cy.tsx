import { OpenBrowserListFragmentDoc } from '../generated/graphql-test'
import OpenBrowserList from './OpenBrowserList.vue'
import { longBrowsersList } from '@packages/frontend-shared/cypress/support/mock-graphql/longBrowsersList'
// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'
import { cyGeneralGlobeX16 } from '@cypress-design/icon-registry'

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

    // Renders a default logo if we don't provide one
    cy.get('[data-cy-browser="fake"]').should('have.attr', 'aria-disabled', 'true')
    cy.get('[data-cy-browser="fake"] svg').eq(0).children().verifyBrowserIconSvg(cyGeneralGlobeX16.data)

    cy.percySnapshot()
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
    cy.get('[aria-checked="true"]').contains('Electron')
  })

  it('throws when activeBrowser is null', () => {
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

    cy.get('[aria-checked="true"]').should('not.exist')
  })

  it('does not call "launch" when clicking on "close"', () => {
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
              onLaunch={cy.stub().as('launch')}
              onCloseBrowser={cy.stub().as('closeBrowser')}/>
          </div>)
      },
    })

    cy.contains('button', defaultMessages.openBrowser.close).click()
    cy.get('@closeBrowser').should('have.been.called')
    cy.get('@launch').should('not.have.been.called')
  })
})
