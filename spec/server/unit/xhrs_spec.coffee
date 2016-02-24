require("../spec_helper")

Xhrs = require("#{root}lib/controllers/xhrs")

describe "lib/controllers/xhr", ->
  beforeEach ->
    @xhr = new Xhrs({})

  describe "#parseContentType", ->
    it "returns application/json", ->
      str = JSON.stringify({foo: "bar"})
      expect(@xhr.parseContentType(str)).to.eq("application/json")

    it "returns text/html", ->
      str = """
      <html>
        <body>foobarbaz</body>
      </html>
      """
      expect(@xhr.parseContentType(str)).to.eq("text/html")

    it "returns text/plain", ->
      str = "foobar<p>baz"
      expect(@xhr.parseContentType(str)).to.eq("text/plain")

    it "returns text/plain by default", ->
      expect(@xhr.parseContentType()).to.eq("text/plain")

  describe "#parseHeaders", ->
    it "returns object literal on undefined", ->
      obj = @xhr.parseHeaders(undefined)
      expect(obj).to.deep.eq({
        "content-type": "text/plain"
      })

    it "uses passed in content-type", ->
      obj = @xhr.parseHeaders({"content-type": "application/json"}, "foo")
      expect(obj).to.deep.eq({
        "content-type": "application/json"
      })

    it "uses response if content-type is omitted", ->
      obj = @xhr.parseHeaders({}, "<html>foo</html>")
      expect(obj).to.deep.eq({
        "content-type": "text/html"
      })

    it "sets content-type to application/json", ->
      str = JSON.stringify({foo: "bar"})
      obj = @xhr.parseHeaders({"x-token": "1234"}, str)
      expect(obj).to.deep.eq({
        "x-token": "1234"
        "content-type": "application/json"
      })