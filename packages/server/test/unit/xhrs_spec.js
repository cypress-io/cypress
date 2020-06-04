require("../spec_helper")

xhrs = require("#{root}lib/controllers/xhrs")

describe "lib/controllers/xhr", ->
  describe "#parseContentType", ->
    it "returns application/json", ->
      str = JSON.stringify({foo: "bar"})
      expect(xhrs.parseContentType(str)).to.eq("application/json")

    it "returns text/html", ->
      str = """
      <html>
        <body>foobarbaz</body>
      </html>
      """
      expect(xhrs.parseContentType(str)).to.eq("text/html")

    it "returns text/plain", ->
      str = "foobar<p>baz"
      expect(xhrs.parseContentType(str)).to.eq("text/plain")

    it "returns text/plain by default", ->
      expect(xhrs.parseContentType()).to.eq("text/plain")

  describe "#parseHeaders", ->
    it "returns object literal on undefined", ->
      obj = xhrs.parseHeaders(undefined)
      expect(obj).to.deep.eq({
        "content-type": "text/plain"
      })

    it "uses passed in content-type", ->
      obj = xhrs.parseHeaders({"content-type": "application/json"}, "foo")
      expect(obj).to.deep.eq({
        "content-type": "application/json"
      })

    it "uses response if content-type is omitted", ->
      obj = xhrs.parseHeaders({}, "<html>foo</html>")
      expect(obj).to.deep.eq({
        "content-type": "text/html"
      })

    it "sets content-type to application/json", ->
      str = JSON.stringify({foo: "bar"})
      obj = xhrs.parseHeaders({"x-token": "1234"}, str)
      expect(obj).to.deep.eq({
        "x-token": "1234"
        "content-type": "application/json"
      })
