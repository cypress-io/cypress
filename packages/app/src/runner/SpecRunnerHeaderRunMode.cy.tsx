import SpecRunnerHeaderRunMode from './SpecRunnerHeaderRunMode.vue'
import { useAutStore } from '../store'
import { createEventManager, createTestAutIframe } from '../../cypress/component/support/ctSupport'

const browser = {
  displayName: 'Chrome',
  majorVersion: 1,
}

describe('SpecRunnerHeaderRunMode', { viewportHeight: 500 }, () => {
  it('renders correctly for e2e', () => {
    cy.window().then((win) => {
      win.__CYPRESS_BROWSER__ = browser
      win.__CYPRESS_TESTING_TYPE__ = 'e2e'
      const autStore = useAutStore()
      const eventManager = createEventManager()
      const autIframe = createTestAutIframe()

      autStore.updateUrl('http://localhost:4000')

      cy.mount(<SpecRunnerHeaderRunMode
        event-manager={eventManager}
        get-aut-iframe={autIframe} />)

      cy.get('[data-cy="aut-url"]').should('be.visible')
      cy.get('[data-cy="playground-activator"]').should('not.exist')
      // confirm expected content is rendered
      cy.contains('1000x660').should('be.visible')
      cy.contains('Chrome 1').should('be.visible')
      cy.contains('http://localhost:4000').should('be.visible')

      // confirm no interactions are implemented
      cy.get('[data-cy="viewport"]').click()
      cy.contains('The viewport determines').should('not.exist')
      cy.contains('Chrome 1').click()
      cy.contains('Firefox').should('not.exist')

      cy.percySnapshot()
    })
  })

  it('renders correctly for component testing', () => {
    cy.window().then((win) => {
      win.__CYPRESS_BROWSER__ = browser
      win.__CYPRESS_TESTING_TYPE__ = 'component'
      const autStore = useAutStore()
      const eventManager = createEventManager()
      const autIframe = createTestAutIframe()

      autStore.updateUrl('http://localhost:4000')

      cy.mount(<SpecRunnerHeaderRunMode
        event-manager={eventManager}
        get-aut-iframe={autIframe} />)

      cy.get('[data-cy="aut-url"]').should('not.exist')
      cy.get('[data-cy="playground-activator"]').should('not.exist')
      // confirm expected content is rendered
      cy.contains('500x500').should('be.visible')
      cy.contains('Chrome 1').should('be.visible')

      // confirm no interactions are implemented
      cy.get('[data-cy="viewport"]').click()
      cy.contains('The viewport determines').should('not.exist')
      cy.contains('Chrome 1').click()
      cy.contains('Firefox').should('not.exist')

      cy.percySnapshot()
    })
  })

  // it('does not show url section if currentTestingType is component', () => {
  //   const autStore = useAutStore()

  //   autStore.updateUrl('http://localhost:3000')

  //   cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
  //     onResult: (gql) => {
  //       gql.currentTestingType = 'component'
  //     },
  //     render: (gqlVal) => {
  //       return renderWithGql(gqlVal)
  //     },
  //   })

  //   cy.get('[data-cy="playground-activator"]').should('be.visible')
  //   cy.get('[data-cy="aut-url"]').should('not.exist')
  // })

  // it('shows current browser and possible browsers', () => {
  //   cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
  //     onResult: (ctx) => {
  //       ctx.currentBrowser = ctx.browsers?.find((x) => x.displayName === 'Chrome') ?? null
  //     },
  //     render: (gqlVal) => {
  //       return renderWithGql(gqlVal)
  //     },
  //   })

  //   cy.get('[data-cy="select-browser"]').click()
  //   cy.findByRole('list').within(() =>
  //     ['Chrome', 'Electron', 'Firefox'].forEach((browser) => cy.findAllByText(browser)))

  //   cy.get('[data-cy="select-browser"] button[aria-controls]').focus().type('{enter}')
  //   cy.contains('Firefox').should('be.hidden')
  // })

  // it('shows current viewport info', () => {
  //   cy.mountFragment(SpecRunnerHeaderFragmentDoc, {
  //     render: (gqlVal) => {
  //       return renderWithGql(gqlVal)
  //     },
  //   })

  //   cy.get('[data-cy="viewport"]').click()
  //   cy.contains('The viewport determines').should('be.visible')
  //   cy.get('[data-cy="viewport"]').click()
  //   cy.contains('The viewport determines').should('be.hidden')
  //   // TODO: enable/remove with resolution of https://github.com/cypress-io/cypress/pull/20156
  //   // cy.get('[data-cy="viewport"] button').focus().type(' ')
  //   cy.get('[data-cy="viewport"] button').focus().type('{enter}')
  //   cy.contains('The viewport determines').should('be.visible')
  //   cy.get('[data-cy="viewport"] button').focus().type('{enter}')
  //   cy.contains('The viewport determines').should('be.hidden')
  // })
})
