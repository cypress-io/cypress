import SpecRunnerHeaderRunMode from './SpecRunnerHeaderRunMode.vue'
import { useAutStore } from '../store'
import { cyGeneralGlobeX16 } from '@cypress-design/icon-registry'

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

      cy.get('[data-cy="select-browser"]').should('be.visible')
      .click()

      cy.contains('Firefox').should('not.exist')
      cy.get('[data-cy="select-browser"]')
      .find('title').should('have.text', 'Chrome 1')

      cy.get('[data-cy="playground-activator"]').should('not.exist')
      // confirm expected content is rendered
      cy.contains('1000x660').should('be.visible')
      cy.contains('40%').should('be.visible')

      cy.contains('http://localhost:4000').should('be.visible')
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

      cy.get('[data-cy="select-browser"]').should('be.visible')
      .click()

      cy.contains('Firefox').should('not.exist')
      cy.get('[data-cy="select-browser"]')
      .find('title').should('have.text', 'Chrome 1')

      cy.contains('URL navigation disabled in component testing').should('be.visible')

      cy.get('[data-cy="playground-activator"]').should('not.exist')
      // confirm expected content is rendered
      cy.contains('500x500').should('be.visible')
      cy.contains('40%').should('be.visible')
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
    })
  })
})
