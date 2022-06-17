import { AppComponent } from './app.component'
import { mount } from 'cypress-angular-component-testing'

it('should', () => {
  mount(AppComponent)
  cy.get('h1').contains('Hello World')
})
