/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { EventEmitter } = require("events");
const {
  _
} = Cypress;

const addLog = function(runner, log) {
  const defaultLog = {
    event: false,
    hookName: "test",
    id: _.uniqueId('l'),
    instrument: "command",
    renderProps: {},
    state: "passed",
    testId: "r3",
    type: "parent",
    url: "http://example.com"
  };

  return runner.emit("reporter:log:add", _.extend(defaultLog, log));
};

describe("aliases", function() {
  context("route aliases", function() {
    beforeEach(function() {
      cy.fixture("runnables_aliases").as("runnables");

      this.runner = new EventEmitter();

      cy.visit("dist").then(win => {
        return win.render({
          runner: this.runner,
          specPath: "/foo/bar"
        });
      });

      return cy.get(".reporter").then(() => {
        this.runner.emit("runnables:ready", this.runnables);
        return this.runner.emit("reporter:start", {});
      });
    });


    describe("without duplicates", function() {
      beforeEach(function() {
        addLog(this.runner, {
          alias: "getUsers",
          aliasType: "route",
          displayName: "xhr stub",
          event: true,
          name: "xhr",
          renderProps: {message: "GET --- /users", indicator: "passed"}
        });
        return addLog(this.runner, {
          aliasType: "route",
          message: "@getUsers, function(){}",
          name: "wait",
          referencesAlias: [{
            cardinal: 1,
            name: "getUsers",
            ordinal: "1st"
          }],
        });
      });

      it("has correct alias class", () => cy.contains('.command-number', '1')
        .parent()
        .find('.command-alias')
        .should('have.class', 'route'));

      return it("render without a count", function() {
        cy.contains('.command-number', '1')
          .parent()
          .within(function() {
            cy.get('.command-alias-count').should('not.exist');
            return cy.contains('.command-alias', '@getUsers')
              .trigger("mouseover");
        });

        return cy.get(".cy-tooltip span").should($tooltip => expect($tooltip).to.contain("Found an alias for: 'getUsers'"));
      });
    });

    describe("with consecutive duplicates", function() {
      beforeEach(function() {
        addLog(this.runner, {
          alias: "getPosts",
          aliasType: "route",
          displayName: "xhr stub",
          event: true,
          name: "xhr",
          renderProps: {message: "GET --- /posts", indicator: "passed"}
        });
        addLog(this.runner, {
          alias: "getPosts",
          aliasType: "route",
          displayName: "xhr stub",
          event: true,
          name: "xhr",
          renderProps: {message: "GET --- /posts", indicator: "passed"}
        });
        addLog(this.runner, {
          aliasType: "route",
          message: "@getPosts, function(){}",
          name: "wait",
          referencesAlias: [{
            cardinal: 1,
            name: "getPosts",
            ordinal: "1st"
          }],
        });
        return addLog(this.runner, {
          aliasType: "route",
          message: "@getPosts, function(){}",
          name: "wait",
          referencesAlias: [{
            cardinal: 2,
            name: "getPosts",
            ordinal: "2nd"
          }],
        });
      });

      it("renders all aliases ", () => cy.get('.command-alias').should('have.length', 3));

      it("render with counts in non-event commands", function() {
        cy.contains('.command-number', '1')
          .parent()
          .within(function() {
            cy.contains('.command-alias-count', '1');
            return cy.contains('.command-alias', '@getPosts')
              .trigger("mouseover");
        });

        cy.get(".cy-tooltip span").should($tooltip => expect($tooltip).to.contain("Found 1st alias for: 'getPosts'"));

        cy.contains('.command-number', '2')
          .parent()
          .within(function() {
            cy.contains('.command-alias-count', '2');
            return cy.contains('.command-alias', '@getPosts')
              .trigger("mouseover");
        });

        return cy.get(".cy-tooltip span").should($tooltip => expect($tooltip).to.contain("Found 2nd alias for: 'getPosts'"));
      });

      it("render with counts in event commands when collapsed", () => cy.get(".command-wrapper")
        .first()
        .within(function() {
          cy.contains('.num-duplicates', '2');
          return cy.contains('.command-alias', 'getPosts');
      }));

      return it("render without counts in event commands when expanded", function() {
        cy.get(".command-expander")
          .first()
          .click();

        return cy.get(".command-wrapper")
          .first()
          .within(function($commandWrapper) {
            cy.get('.num-duplicates').should('not.be.visible');
            return cy.contains('.command-alias', 'getPosts');
        });
      });
    });

    return describe("with non-consecutive duplicates", function() {
      beforeEach(function() {
        addLog(this.runner, {
          alias: "getPosts",
          aliasType: "route",
          displayName: "xhr stub",
          event: true,
          name: "xhr",
          renderProps: {message: "GET --- /posts", indicator: "passed"}
        });
        addLog(this.runner, {
          alias: "getUsers",
          aliasType: "route",
          displayName: "xhr stub",
          event: true,
          name: "xhr",
          renderProps: {message: "GET --- /users", indicator: "passed"}
        });
        addLog(this.runner, {
          alias: "getPosts",
          aliasType: "route",
          displayName: "xhr stub",
          event: true,
          name: "xhr",
          renderProps: {message: "GET --- /posts", indicator: "passed"}
        });
        addLog(this.runner, {
          aliasType: "route",
          message: "@getPosts, function(){}",
          name: "wait",
          referencesAlias: [{
            cardinal: 1,
            name: "getPosts",
            ordinal: "1st"
          }],
        });
        addLog(this.runner, {
          aliasType: "route",
          message: "@getUsers, function(){}",
          name: "wait",
          referencesAlias: [{
            cardinal: 1,
            name: "getUsers",
            ordinal: "1st"
          }],
        });
        return addLog(this.runner, {
          aliasType: "route",
          message: "@getPosts, function(){}",
          name: "wait",
          referencesAlias: [{
            cardinal: 2,
            name: "getPosts",
            ordinal: "2nd"
          }],
        });
      });

      return it("render with counts", function() {
        cy.contains('.command-number', '1')
          .parent()
          .within(function() {
            cy.contains('.command-alias-count', '1');
            return cy.contains('.command-alias', '@getPosts')
              .trigger("mouseover");
        });

        cy.get(".cy-tooltip span").should($tooltip => expect($tooltip).to.contain("Found 1st alias for: 'getPosts'"));

        cy.contains('.command-number', '3')
          .parent()
          .within(function() {
            cy.contains('.command-alias-count', '2');
            return cy.contains('.command-alias', '@getPosts')
              .trigger("mouseover");
        });

        return cy.get(".cy-tooltip span").should($tooltip => expect($tooltip).to.contain("Found 2nd alias for: 'getPosts'"));
      });
    });
  });

  return context("element aliases", function() {
    beforeEach(function() {
      cy.fixture("runnables_aliases").as("runnables");

      this.runner = new EventEmitter();

      cy.visit("cypress/support/index.html").then(win => {
        return win.render({
          runner: this.runner,
          specPath: "/foo/bar"
        });
      });

      return cy.get(".reporter").then(() => {
        this.runner.emit("runnables:ready", this.runnables);
        return this.runner.emit("reporter:start", {});
      });
    });

    describe("without duplicates", function() {
      beforeEach(function() {
        addLog(this.runner, {
          state: "passed",
          name: "get",
          message: "body",
          alias: "barAlias",
          aliasType: "dom",
          event: true,
          renderProps: {message: "", indicator: "passed"}
        });
        return addLog(this.runner, {
          aliasType: "dom",
          message: "",
          name: "get",
          referencesAlias: [{
            cardinal: 1,
            name: "barAlias",
            ordinal: "1st"
          }],
        });
      });

      it("has correct alias class", () => cy.contains('.command-number', '1')
        .parent()
        .find('.command-alias')
        .should('have.class', 'dom'));

      return it("render without a count", function() {
        cy.contains('.command-number', '1')
          .parent()
          .within(function() {
            cy.get('.command-alias-count').should('not.exist');
            return cy.contains('.command-alias', '@barAlias')
              .trigger("mouseover");
        });

        return cy.get(".cy-tooltip span").should($tooltip => expect($tooltip).to.contain("Found an alias for: 'barAlias'"));
      });
    });

    describe("with consecutive duplicates", function() {
      beforeEach(function() {
        addLog(this.runner, {
          state: "passed",
          name: "get",
          message: "[attr='dropdown']",
          alias: "dropdown",
          aliasType: "dom",
          event: true,
          renderProps: {message: "", indicator: "passed"}
        });
        addLog(this.runner, {
          state: "passed",
          name: "get",
          message: "select",
          alias: "dropdown",
          aliasType: "dom",
          event: true,
          renderProps: {message: "", indicator: "passed"}
        });
        addLog(this.runner, {
          aliasType: "dom",
          message: "",
          name: "get",
          referencesAlias: [{
            cardinal: 1,
            name: "dropdown",
            ordinal: "1st"
          }],
        });
        return addLog(this.runner, {
          aliasType: "dom",
          message: "",
          name: "get",
          referencesAlias: [{
            cardinal: 2,
            name: "dropdown",
            ordinal: "2nd"
          }],
        });
      });

      it("render without a count in non-event commands", function() {
        cy.contains('.command-number', '1')
          .parent()
          .within(function() {
            cy.get('.command-alias-count').should('not.exist');
            return cy.contains('.command-alias', '@dropdown')
              .trigger("mouseover");
        });

        cy.get(".cy-tooltip span").should($tooltip => expect($tooltip).to.contain("Found an alias for: 'dropdown'"));

        cy.contains('.command-number', '2')
          .parent()
          .within(function() {
            cy.get('.command-alias-count').should('not.exist');
            return cy.contains('.command-alias', '@dropdown')
              .trigger("mouseover");
        });

        return cy.get(".cy-tooltip span").should($tooltip => expect($tooltip).to.contain("Found an alias for: 'dropdown'"));
      });

      return it("render without counts in event commands when collapsed", () => cy.get(".command-wrapper")
        .first()
        .within(function() {
          cy.get('.num-duplicates').should('not.be.visible');
          return cy.contains('.command-alias', 'dropdown');
      }));
    });

    return describe("with non-consecutive duplicates", function() {
      beforeEach(function() {
        addLog(this.runner, {
          state: "passed",
          name: "get",
          message: "[attr='dropdown']",
          alias: "dropdown",
          aliasType: "dom",
          event: true,
          renderProps: {message: "", indicator: "passed"}
        });
        addLog(this.runner, {
          state: "passed",
          name: "get",
          message: "[attr='modal']",
          alias: "modal",
          aliasType: "dom",
          event: true,
          renderProps: {message: "", indicator: "passed"}
        });
        addLog(this.runner, {
          state: "passed",
          name: "get",
          message: "[attr='dropdown']",
          alias: "dropdown",
          aliasType: "dom",
          event: true,
          renderProps: {message: "", indicator: "passed"}
        });
        addLog(this.runner, {
          aliasType: "dom",
          message: "",
          name: "get",
          referencesAlias: [{
            cardinal: 1,
            name: "dropdown",
            ordinal: "1st"
          }],
        });
        addLog(this.runner, {
          aliasType: "dom",
          message: "",
          name: "get",
          referencesAlias: [{
            cardinal: 1,
            name: "modal",
            ordinal: "1st"
          }],
        });
        return addLog(this.runner, {
          aliasType: "dom",
          message: "",
          name: "get",
          referencesAlias: [{
            cardinal: 2,
            name: "dropdown",
            ordinal: "2nd"
          }],
        });
      });

      it("renders all aliases ", () => cy.get('.command-alias').should('have.length', 6));

      return it("render without counts", function() {
        cy.contains('.command-number', '1')
          .parent()
          .within(function() {
            cy.get('.command-alias-count').should('not.exist');
            return cy.contains('.command-alias', '@dropdown')
              .trigger("mouseover");
        });

        cy.get(".cy-tooltip span").should($tooltip => expect($tooltip).to.contain("Found an alias for: 'dropdown'"));

        cy.contains('.command-number', '3')
          .parent()
          .within(function() {
            cy.get('.command-alias-count').should('not.exist');
            return cy.contains('.command-alias', '@dropdown')
              .trigger("mouseover");
        });

        return cy.get(".cy-tooltip span").should($tooltip => expect($tooltip).to.contain("Found an alias for: 'dropdown'"));
      });
    });
  });
});
