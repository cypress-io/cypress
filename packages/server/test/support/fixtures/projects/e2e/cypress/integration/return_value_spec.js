/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
it("errors when invoking commands and return a different value", function() {
  cy.wrap(null);

  return [{}, 1, 2, "foo", (function() {})];
});

it("errors when invoking commands in custom command and returning different value", function() {
  Cypress.Commands.add("foo", function() {
    cy.wrap(null);

    return "bar";
  });

  return cy.foo();
});

it("errors when not invoking commands, invoking done callback, and returning a promise", done => Promise.resolve(null).then(() => done()));
