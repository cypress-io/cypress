/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
it("t1", function() {});
it("t2", function() {});
it("t3", function() {});

describe("s1", function() {
  it.only("t3", function() {});

  it.only("t4");

  return it("t5", function() {});
});

describe("s2", () => it("t3", function() {}));
