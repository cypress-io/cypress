/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const xhrs = require(`${root}lib/controllers/xhrs`);

describe("lib/controllers/xhr", function() {
  describe("#parseContentType", function() {
    it("returns application/json", function() {
      const str = JSON.stringify({foo: "bar"});
      return expect(xhrs.parseContentType(str)).to.eq("application/json");
    });

    it("returns text/html", function() {
      const str = `\
<html>
  <body>foobarbaz</body>
</html>\
`;
      return expect(xhrs.parseContentType(str)).to.eq("text/html");
    });

    it("returns text/plain", function() {
      const str = "foobar<p>baz";
      return expect(xhrs.parseContentType(str)).to.eq("text/plain");
    });

    return it("returns text/plain by default", () => expect(xhrs.parseContentType()).to.eq("text/plain"));
  });

  return describe("#parseHeaders", function() {
    it("returns object literal on undefined", function() {
      const obj = xhrs.parseHeaders(undefined);
      return expect(obj).to.deep.eq({
        "content-type": "text/plain"
      });
    });

    it("uses passed in content-type", function() {
      const obj = xhrs.parseHeaders({"content-type": "application/json"}, "foo");
      return expect(obj).to.deep.eq({
        "content-type": "application/json"
      });
    });

    it("uses response if content-type is omitted", function() {
      const obj = xhrs.parseHeaders({}, "<html>foo</html>");
      return expect(obj).to.deep.eq({
        "content-type": "text/html"
      });
    });

    return it("sets content-type to application/json", function() {
      const str = JSON.stringify({foo: "bar"});
      const obj = xhrs.parseHeaders({"x-token": "1234"}, str);
      return expect(obj).to.deep.eq({
        "x-token": "1234",
        "content-type": "application/json"
      });
    });
  });
});
