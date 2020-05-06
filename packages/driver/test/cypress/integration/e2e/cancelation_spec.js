/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {
  Promise
} = Cypress;

let previousTestWasCanceled = false;
let calledAfterDoneEarly = false;

describe("canceling command queues", function() {
  it("Cypress.stop()", function(done) {
    cy.stub(Cypress.runner, "stop");

    let calledAfterStop = false;

    cy.once("stop", function() {
      expect(cy.state("promise").isCancelled()).to.be.true;

      return Promise
      .delay(50)
      .then(function() {
        expect(calledAfterStop).to.be.false;
        return done();
      });
    });

    return cy.wrap(null).then(function() {
      Cypress.stop();

      return null;}).then(() => //# should not be called
    calledAfterStop = true);
  });

  it("done early", function(done) {
    cy.once("command:start", function(cmd) {
      const {
        cancel
      } = cy.state("promise");
      cy.state("promise").cancel = function() {
        previousTestWasCanceled = true;
        return cancel.apply(this, arguments);
      };

      return done();
    });

    return cy.wrap(null).then(() => calledAfterDoneEarly = true);
  });

  it("verifies the previous test worked", function() {
    expect(previousTestWasCanceled).to.be.true;
    return expect(calledAfterDoneEarly).to.be.false;
  });

  return it("command failure", function(done) {
    //# make sure there are no unhandled rejections
    Promise.onPossiblyUnhandledRejection(done);

    let calledAfterFailure = false;

    cy.on("fail", () => Promise
    .delay(50)
    .then(function() {
      expect(cy.isStopped()).to.be.true; //# make sure we ran our cleanup routine
      expect(calledAfterFailure).to.be.false;
      return done();
    }));

    return cy.wrap(null).then(function() {
      throw new Error("foo");}).then(() => calledAfterFailure = true);
  });
});
