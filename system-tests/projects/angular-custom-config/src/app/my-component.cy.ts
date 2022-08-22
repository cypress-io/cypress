import { MyComponent } from './my-component'

describe('MyComponent', () => {
  it('should mount with an h1 tag with a class of very-red', () => {
    cy.mount(MyComponent)
    cy.get('h1').should('have.css', 'color', 'rgb(255, 0, 0)')
  })
})
