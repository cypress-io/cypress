/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const CacheBuster = require(`${root}lib/util/cache_buster`);

describe("lib/cache_buster", function() {
  context("#get", () => it("returns seperator + 3 characters", () => expect(CacheBuster.get().length).to.eq(4)));

  return context("#strip", function() {
    it("strips cache buster", function() {
      const rand = CacheBuster.get();
      const file = `foo.js${rand}`;
      return expect(CacheBuster.strip(file)).to.eq("foo.js");
    });

    return it("is noop without cache buster", function() {
      const file = "foo.js";
      return expect(CacheBuster.strip(file)).to.eq("foo.js");
    });
  });
});
