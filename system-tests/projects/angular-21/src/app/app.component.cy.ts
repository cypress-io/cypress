// Keep this test very simple as "@cypress/schematic" relies on it to run smoke tests
import { AppComponent } from './app.component'

it('should', () => {
  cy.mount(AppComponent)
  cy.get('h1').contains('Hello World', { timeout: 250 })
})
