import SpecRunnerHeaderRunMode from './SpecRunnerHeaderRunMode.vue'
import { useAutStore } from '../store'
import { cyGeneralGlobeX16, cyBrowserChromeX16 } from '@cypress-design/icon-registry'

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

      autStore.updateUrl('http://localhost:4000')
      autStore.setScale(0.4)

      cy.mount(<SpecRunnerHeaderRunMode/>)

      cy.get('[data-cy="aut-url"]').should('be.visible')
      cy.get('[data-cy="playground-activator"]').should('not.exist')
      // confirm expected content is rendered
      cy.contains('1000x660').should('be.visible')
      cy.contains('40%').should('be.visible')
      cy.contains('Chrome 1').should('be.visible')
      cy.contains('http://localhost:4000').should('be.visible')

      // confirm no interactions are implemented
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

      autStore.updateUrl('http://localhost:4000')
      autStore.setScale(0.4)

      cy.mount(<SpecRunnerHeaderRunMode />)

      cy.contains('URL navigation disabled in component testing').should('be.visible')
      cy.get('[data-cy="playground-activator"]').should('not.exist')
      // confirm expected content is rendered
      cy.contains('500x500').should('be.visible')
      cy.contains('40%').should('be.visible')
      cy.contains('Chrome 1').should('be.visible')

      // confirm no interactions are implemented
      cy.contains('Chrome 1').click()
      cy.contains('Firefox').should('not.exist')
    })
  })

  it('disables browser dropdown button when specs are running', () => {
    cy.window().then((win) => {
      win.__CYPRESS_BROWSER__ = browser
      win.__CYPRESS_TESTING_TYPE__ = 'e2e'
      const autStore = useAutStore()

      autStore.updateUrl('http://localhost:4000')
      autStore.setIsRunning(true)

      cy.mount(<SpecRunnerHeaderRunMode />)

      cy.get('[data-cy="select-browser"] > button svg').eq(0).children().verifyBrowserIconSvg(cyBrowserChromeX16.data)
      cy.get('[data-cy="select-browser"] > button').should('be.disabled')
    })
  })

  it('shows generic browser icon when current browser icon is not configured', () => {
    cy.window().then((win) => {
      win.__CYPRESS_BROWSER__ = { ...browser, displayName: 'Fake Browser' }
      win.__CYPRESS_TESTING_TYPE__ = 'e2e'
      const autStore = useAutStore()

      autStore.updateUrl('http://localhost:4000')
      autStore.setIsRunning(true)

      cy.mount(<SpecRunnerHeaderRunMode />)

      cy.get('[data-cy="select-browser"] > button svg').eq(0).children().verifyBrowserIconSvg(cyGeneralGlobeX16.data)
      cy.get('[data-cy="select-browser"] > button').should('be.disabled')
    })
  })
})
