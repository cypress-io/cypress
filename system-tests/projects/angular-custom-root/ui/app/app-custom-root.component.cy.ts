import { AppComponent } from './app.component'

describe('AppComponent', () => {
  it('should mount', () => {
    cy.mount(AppComponent)
    cy.contains('h1', 'Hello World!')
  })

  it('component should mount inside data-cy-root\'s original location', () => {
    cy.mount(AppComponent)
    cy.get('div[data-cy-root]').should('exist').parent().should('have.id', 'container')
    cy.get('#container').should('exist').parent().should('have.prop', 'tagName').should('eq', 'BODY')
  })
})