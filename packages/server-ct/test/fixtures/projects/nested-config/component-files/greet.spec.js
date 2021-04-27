import { greet } from './greet'

it('greets', () => {
  greet()
  cy.get('div').contains('Hello world')
})
