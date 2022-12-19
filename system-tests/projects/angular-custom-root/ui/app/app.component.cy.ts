import { AppComponent } from './app.component'

describe('AppComponent', () => {
  it('should mount', () => {
    cy.mount(AppComponent)
    cy.contains('h1', 'Hello World!')
  })
})
