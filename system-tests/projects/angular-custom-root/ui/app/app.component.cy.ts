import { App } from './app'

describe('AppComponent', () => {
  it('should mount', () => {
    cy.mount(App)
    cy.contains('h1', 'Hello World!')
  })
})
