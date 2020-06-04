/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const humanInterval = require("human-interval");
const humanTime     = require(`${root}lib/util/human_time`);

describe("lib/util/human_time", function() {
  context(".long", function() {
    it("outputs minutes + seconds", function() {
      expect(humanTime.long(humanInterval("2 minutes and 3 seconds"))).to.eq("2 minutes, 3 seconds");
      expect(humanTime.long(humanInterval("65 minutes"))).to.eq("65 minutes, 0 seconds");
      return expect(humanTime.long(humanInterval("1 minute"))).to.eq("1 minute, 0 seconds");
    });

    return it("outputs seconds", function() {
      expect(humanTime.long(humanInterval("59 seconds"))).to.eq("59 seconds");
      return expect(humanTime.long(humanInterval("1 second"))).to.eq("1 second");
    });
  });

  return context(".short", function() {
    it("outputs mins", function() {
      expect(humanTime.short(humanInterval("2 minutes and 3 seconds"))).to.eq("2m, 3s");
      expect(humanTime.short(humanInterval("65 minutes"))).to.eq("65m");
      return expect(humanTime.short(humanInterval("1 minute"))).to.eq("1m");
    });

    return it("outputs seconds", function() {
      expect(humanTime.short(humanInterval("59 seconds"))).to.eq("59s");
      expect(humanTime.short(humanInterval("1 second"))).to.eq("1s");
      expect(humanTime.short(0)).to.eq("0s");
      expect(humanTime.short(500)).to.eq("500ms");
      return expect(humanTime.short(10)).to.eq("10ms");
    });
  });
});
