/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//# https://github.com/cypress-io/cypress/issues/652
describe("issue 652", function() {
  before(() => cy.visit("/fixtures/issue-652.html"));

  return it('should visit all the hashes', function() {
    // cy.wait(0)
    cy.visit('/fixtures/issue-652.html#one');
    // cy.wait(0)
    cy.visit('/fixtures/issue-652.html#two');
    // cy.wait(0)
    cy.visit('/fixtures/issue-652.html#three');

    return cy.get('#visited')
      .should('contain', 'one')
      .should('contain', 'two')
      .should('contain', 'three');
  });
});
