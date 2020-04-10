// https://github.com/cypress-io/cypress/issues/4373
describe('issue 4373', () => {
  it('handles salesforce lightning components', () => {
    cy.visit('/fixtures/issue-4373.html')
    cy.get('lightning-badge')
  })
})
