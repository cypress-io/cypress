/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress);
const {
  _
} = Cypress;

describe("src/cy/commands/angular", function() {
  before(() => cy
    .visit("/fixtures/angular.html"));

  return describe("#ng", function() {
    context("find by binding", function() {
      it("finds color.name binding elements", function() {
        const spans = cy.$$(".colors span.name");

        return cy.ng("binding", "color.name").then($spans => $spans.each((i, span) => expect(span).to.eq(spans[i])));
      });

      return describe("errors", function() {
        beforeEach(function() {
          Cypress.config("defaultCommandTimeout", 50);

          return this.angular = cy.state("window").angular;
        });

        afterEach(function() {
          return cy.state("window").angular = this.angular;
        });

        it("throws when cannot find angular", function(done) {
          delete cy.state("window").angular;

          cy.on("fail", function(err) {
            expect(err.message).to.include("Angular global (`window.angular`) was not found in your window. You cannot use `cy.ng()` methods without angular.");
            return done();
          });

          return cy.ng("binding", "phone");
        });

        it("throws when binding cannot be found", function(done) {
          cy.on("fail", function(err) {
            expect(err.message).to.include("Could not find element for binding: 'not-found'.");
            return done();
          });

          return cy.ng("binding", "not-found");
        });

        return it("cancels additional finds when aborted", function(done) {
          cy.timeout(1000);
          cy.stub(Cypress.runner, "stop");

          let retry = _.after(2, () => {
            return Cypress.stop();
          });

          cy.on("command:retry", retry);

          cy.on("fail", err => done(err));

          cy.on("stop", () => {
            retry = cy.spy(cy, "retry");

            return _.delay(function() {
              expect(retry.callCount).to.eq(0);
              return done();
            }
            , 100);
          });

          return cy.ng("binding", "not-found");
        });
      });
    });

    context("find by repeater", function() {
      const ngPrefixes = {"phone in phones": 'ng-', "phone2 in phones": 'ng_', "phone3 in phones": 'data-ng-', "phone4 in phones": 'x-ng-'};

      _.each(ngPrefixes, (prefix, attr) => it(`finds by ${prefix}repeat`, function() {
        //# make sure we find this element
        const li = cy.$$(`[${prefix}repeat*='${attr}']`);
        expect(li).to.exist;

        //# and make sure they are the same DOM element
        return cy.ng("repeater", attr).then($li => expect($li.get(0)).to.eq(li.get(0)));
      }));

      it("favors earlier items in the array when duplicates are found", function() {
        const li = cy.$$("[ng-repeat*='foo in foos']");

        return cy.ng("repeater", "foo in foos").then($li => expect($li.get(0)).to.eq(li.get(0)));
      });

      it("waits to find a missing input", function() {
        const missingLi = $("<li />", {"data-ng-repeat": "li in lis"});

        //# wait until we're ALMOST about to time out before
        //# appending the missingInput
        cy.on("command:retry", _.after(2, () => {
          return cy.$$("body").append(missingLi);
        })
        );

        return cy.ng("repeater", "li in lis").then($li => expect($li).to.match(missingLi));
      });

      describe("errors", function() {
        beforeEach(function() {
          Cypress.config("defaultCommandTimeout", 50);

          return this.angular = cy.state("window").angular;
        });

        afterEach(function() {
          return cy.state("window").angular = this.angular;
        });

        it("throws when repeater cannot be found", function(done) {
          cy.on("fail", function(err) {
            expect(err.message).to.include("Could not find element for repeater: 'not-found'.  Searched [ng-repeat*='not-found'], [ng_repeat*='not-found'], [data-ng-repeat*='not-found'], [x-ng-repeat*='not-found'].");
            return done();
          });

          return cy.ng("repeater", "not-found");
        });

        it("cancels additional finds when aborted", function(done) {
          cy.timeout(1000);
          cy.stub(Cypress.runner, "stop");

          let retry = _.after(2, () => {
            return Cypress.stop();
          });

          cy.on("command:retry", retry);

          cy.on("fail", err => done(err));

          cy.on("stop", () => {
            retry = cy.spy(cy, "retry");

            return _.delay(function() {
              expect(retry.callCount).to.eq(0);
              return done();
            }
            , 100);
          });

          return cy.ng("repeater", "not-found");
        });

        return it("throws when cannot find angular", function(done) {
          delete cy.state("window").angular;

          cy.on("fail", function(err) {
            expect(err.message).to.include("Angular global (`window.angular`) was not found in your window. You cannot use `cy.ng()` methods without angular.");
            return done();
          });

          return cy.ng("repeater", "phone in phones");
        });
      });

      return describe("log", function() {
        beforeEach(function() {
          this.logs = [];

          cy.on("log:added", (attrs, log) => {
            if (attrs.name === "assert") {
              this.lastLog = log;
              return this.logs.push(log);
            }
          });

          return null;
        });

        return it("does not incorrectly merge 2nd assertion into 1st", function() {
          return cy
            .ng("repeater", "foo in foos").should("have.length", 2)
            .url().should("include", ":")
            .then(() => {
              expect(this.logs.length).to.eq(2);
              expect(this.logs[0].get("state")).to.eq("passed");
              return expect(this.logs[1].get("state")).to.eq("passed");
          });
        });
      });
    });

    return context("find by model", function() {
      const ngPrefixes = {query: 'ng-', query2: 'ng_', query3: 'data-ng-', query4: 'x-ng-'};

      _.each(ngPrefixes, (prefix, attr) => it(`finds element by ${prefix}model`, function() {
        //# make sure we find this element
        const input = cy.$$(`[${prefix}model=${attr}]`);
        expect(input).to.exist;

        //# and make sure they are the same DOM element
        return cy.ng("model", attr).then($input => expect($input.get(0)).to.eq(input.get(0)));
      }));

      it("favors earlier items in the array when duplicates are found", function() {
        const input = cy.$$("[ng-model=foo]");

        return cy.ng("model", "foo").then($input => expect($input.get(0)).to.eq(input.get(0)));
      });

      it("waits to find a missing input", function() {
        const missingInput = $("<input />", {"data-ng-model": "missing-input"});

        //# wait until we're ALMOST about to time out before
        //# appending the missingInput
        cy.on("command:retry", _.after(2, () => cy.$$("body").append(missingInput))
        );

        return cy.ng("model", "missing-input").then($input => expect($input).to.match(missingInput));
      });

      it("cancels other retries when one resolves", function() {
        const retry = cy.spy(cy, "retry");

        const missingInput = $("<input />", {"data-ng-model": "missing-input"});

        cy.on("command:retry", _.after(6, _.once(() => {
          return cy.$$("body").append(missingInput);
        })
        )
        );

        //# we want to make sure that the ng promises do not continue
        //# to retry after the first one resolves
        return cy.ng("model", "missing-input")
        .then(() => retry.resetHistory()).wait(100)
        .then(() => expect(retry.callCount).to.eq(0));
      });

      return describe("errors", function() {
        beforeEach(function() {
          Cypress.config("defaultCommandTimeout", 50);

          return this.angular = cy.state("window").angular;
        });

        afterEach(function() {
          return cy.state("window").angular = this.angular;
        });

        it("throws when model cannot be found", function(done) {
          cy.ng("model", "not-found");

          return cy.on("fail", function(err) {
            expect(err.message).to.include("Could not find element for model: 'not-found'.  Searched [ng-model='not-found'], [ng_model='not-found'], [data-ng-model='not-found'], [x-ng-model='not-found'].");
            return done();
          });
        });

        it("cancels additional finds when aborted", function(done) {
          cy.timeout(1000);
          cy.stub(Cypress.runner, "stop");

          let retry = _.after(2, () => {
            return Cypress.stop();
          });

          cy.on("command:retry", retry);

          cy.on("fail", err => done(err));

          cy.on("stop", () => {
            retry = cy.spy(cy, "retry");

            return _.delay(function() {
              expect(retry.callCount).to.eq(0);
              return done();
            }
            , 100);
          });

          return cy.ng("model", "not-found");
        });

        return it("throws when cannot find angular", function(done) {
          delete cy.state("window").angular;

          cy.on("fail", function(err) {
            expect(err.message).to.include("Angular global (`window.angular`) was not found in your window. You cannot use `cy.ng()` methods without angular.");
            return done();
          });

          return cy.ng("model", "query");
        });
      });
    });
  });
});
