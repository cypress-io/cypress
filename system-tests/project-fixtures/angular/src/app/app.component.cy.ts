import { AppComponent } from './app.component'

it('should', () => {
  cy.mount(AppComponent)
  cy.get('h1').contains('Hello World')
  cy.get('.test-img')
  .invoke('css', 'background-image')
  .then((img) => {
    expect(img).to.contain('__cypress/src/test.png')
  })
})
