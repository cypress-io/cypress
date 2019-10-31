/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//# NOTE: we could clean up this test a lot
//# by probably using preserve:run:state event
//# or by using localstorage

//# store these on our outer top window
//# so they are globally preserved
if (window.top.hasRunOnce == null) { window.top.hasRunOnce = false; }
if (window.top.previousHash == null) { window.top.previousHash = window.top.location.hash; }

const isTextTerminal = Cypress.config("isTextTerminal");

describe("rerun state bugs", () =>
  it("stores viewport globally and does not hang on re-runs", () =>
    //# NOTE: there's probably other ways to cause a re-run
    //# event more programatically (like firing it through Cypress)
    //# but we get the hashchange coverage for free on this.

    cy.viewport(500, 500).then(function() {
      let hash;
      if (!window.top.hasRunOnce) {
        //# turn off mocha events for a second
        Cypress.config("isTextTerminal", false);

        //# 1st time around
        window.top.hasRunOnce = true;

        //# cause a rerun event to occur
        //# by changing the hash
        ({ hash } = window.top.location);
        return window.top.location.hash = hash + "?rerun";
      } else {
        if (window.top.location.hash === window.top.previousHash) {
          //# 3rd time around
          //# let the mocha end events fire if they're supposed to
          return Cypress.config("isTextTerminal", isTextTerminal);
        } else {
          //# our test has already run so remove
          //# the query param
          //# 2nd time around
          return window.top.location.hash = window.top.previousHash;
        }
      }
    })
  )
);
