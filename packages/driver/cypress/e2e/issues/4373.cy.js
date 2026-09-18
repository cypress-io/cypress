// https://github.com/cypress-io/cypress/issues/4373
describe('cy.get on a custom element rendered by Salesforce Lightning', () => {
  it('finds the element when the framework patches Node.prototype', () => {
    cy.visit('/fixtures/issue-4373.html')
    cy.get('lightning-badge')
  })
})
