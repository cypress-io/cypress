import {App} from './App.jsx'

it('should render ', () => {
  cy.mount(App)
  cy.contains('Hello World!')
})
