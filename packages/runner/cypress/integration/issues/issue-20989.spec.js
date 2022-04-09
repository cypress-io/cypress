// https://github.com/cypress-io/cypress/issues/20989
describe('issue 20989', { baseUrl: null, includeShadowDom: true }, () => {
  it('highlights elements inside shadow roots', () => {
    Cypress.SelectorPlayground.defaults({
      onElement: ($el) => {
        const testId = $el.attr('data-testid')

        if (testId) {
          return `[data-testid=${testId}]`
        }
      },
    })

    cy.visit('/cypress/fixtures/issues/issue-20989.html')
  })
})
