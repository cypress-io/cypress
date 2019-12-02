/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const _ = require("lodash");
const Automation = require(`${root}lib/automation`);

describe("lib/automation", function() {
  beforeEach(function() {
    return this.automation = Automation.create();
  });

  return context(".reset", () =>
    it("resets middleware", function() {
      const m = this.automation.get();

      //# all props are null by default
      expect(_.omitBy(m, _.isNull)).to.deep.eq({});

      const onRequest = function() {};
      const onPush = function() {};
      this.automation.use({ onRequest, onPush });

      expect(this.automation.get().onRequest).to.eq(onRequest);
      expect(this.automation.get().onPush).to.eq(onPush);

      this.automation.reset();

      expect(this.automation.get().onRequest).to.be.null;

      //# keep around onPush
      return expect(this.automation.get().onPush).to.eq(onPush);
    })
  );
});
