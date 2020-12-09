/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const testAfterRuns = [];

Cypress.on("test:after:run", test => testAfterRuns.push(test.title));

//# this should run
it("t1a", function() {});

//# these 3 should be skipped
describe("s1a", function() {
  beforeEach(() => cy.get(".does-not-exist", {timeout: 100}));

  it("t2a", function() {});
  it("t3a", function() {});
  return it("t4a", function() {});
});

//# these 3 should run
describe("s2a", function() {
  it("t5a", function() {});
  it("t6a", function() {});
  return it("t7a", function() {});
});

describe("s3a", function() {
  before(() => cy.wrap().then(function() {
    throw new Error("s3a before hook failed");
  }));

  after(() => //# it should not have fired test:after:run
  //# for t8a yet
  expect(testAfterRuns).to.deep.eq([
    "t1a",
    "t2a",
    "t5a",
    "t6a",
    "t7a"
  ]));

  it("t8a", function() {});
  return it("t9a", function() {});
});

describe("s4a", function() {
  before(function() {
    throw new Error("s4a before hook failed");
  });

  return it("t10a", function() {});
});

describe("s5a", () => it("fires all test:after:run events", () => expect(testAfterRuns).to.deep.eq([
  "t1a",
  "t2a",
  "t5a",
  "t6a",
  "t7a",
  "t8a",
  "t10a"
])));
