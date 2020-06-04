/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("@percy/cypress");
require('cypress-react-unit-test/dist/hooks');

const BluebirdPromise = require("bluebird");

beforeEach(function() {
  return this.util = {
    deferred(Promise = BluebirdPromise) {
      const deferred = {};
      deferred.promise = new Promise(function(resolve, reject) {
        deferred.resolve = resolve;
        return deferred.reject = reject;
      });
      return deferred;
    },

    deepClone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  };});

Cypress.Commands.add("visitIndex", (options = {}) => cy.visit('/', options));

Cypress.Commands.add("shouldBeOnIntro", () => cy.get(".main-nav .logo"));

Cypress.Commands.add("shouldBeOnProjectSpecs", function() {
  cy.contains(".folder", "integration");
  return cy.contains(".folder", "unit");
});

Cypress.Commands.add("logOut", function() {
  cy.contains("Jane Lane").click();
  return cy.contains("Log Out").click();
});

Cypress.Commands.add("shouldBeLoggedOut", () => cy.contains(".main-nav a", "Log In"));

Cypress.Commands.add("setAppStore", (options = {}) => cy.window()
.then(win => win.AppStore.set(options)));
