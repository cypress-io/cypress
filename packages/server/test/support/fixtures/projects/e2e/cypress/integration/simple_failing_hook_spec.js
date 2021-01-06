/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe("simple failing hook spec", function() {
  context("beforeEach hooks", function() {
    beforeEach(function() {
      throw new Error("fail1");
    });

    return it("never gets here", function() {});
  });

  context("pending", () => it("is pending"));

  context("afterEach hooks", function() {
    afterEach(function() {
      throw new Error("fail2");
    });

    it("runs this", function() {});

    return it("does not run this", function() {});
  });

  return context("after hooks", function() {
    after(function() {
      throw new Error("fail3");
    });

    it("runs this", function() {});

    return it("fails on this", function() {});
  });
});
