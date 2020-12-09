/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let invokedDoesNotRun = false;
let invokedDoesRun = false;
let afterVisitCommand = false;
const runnableAfterRunAsync = [];
const testAfterRun = [];

Cypress.on("runnable:after:run:async", function(obj, runnable) {
  if (obj.err) {
    return runnableAfterRunAsync.push(obj.title);
  }
});

Cypress.on("test:after:run", test => testAfterRun.push(test.title));

describe("uncaught hook error should continue to fire all mocha events", function() {
  context("s1", function() {
    beforeEach(() => //# when this beforeEach hook fails
    //# it will skip invoking the test
    //# but run the other suite
    cy.visit("http://localhost:7878/visit_error.html").then(() => //# it should cancel the command queue on
    //# uncaught error and NOT reach this code
    afterVisitCommand = true));

    //# TODO: look at why this is running.......
    return it("does not run", () => invokedDoesNotRun = true);
  });

  return context("s2", function() {
    it("does run", () => invokedDoesRun = true);

    return it("also runs", function() {
      //# should not have executed the body of this test
      expect(invokedDoesNotRun, "1st").to.be.false;

      //# should have executed the body of this test
      expect(invokedDoesRun, "2nd").to.be.true;

      //# should not have reached command after visit
      expect(afterVisitCommand, "3rd").to.be.false;

      expect(runnableAfterRunAsync).to.deep.eq([
        '"before each" hook'
      ]);

      //# our last test here has not yet pushed into test:after:run
      return expect(testAfterRun).to.deep.eq([
        //# even though the test code itself did not
        //# run, we should still receive a test:after:run
        //# event for this
        "does not run",

        //# and this test should continue running normally
        "does run"
      ]);
    });
  });
});
