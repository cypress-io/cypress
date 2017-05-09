require("../spec_helper")

origin = require("#{root}lib/util/origin")

describe "lib/util/origin", ->
  beforeEach ->
    @expects = (url, expected) ->
      expect(origin(url)).to.eq(expected)

  it "strips everything but the remote origin", ->
    @expects("http://localhost:9999/foo/bar?baz=quux#/index.html", "http://localhost:9999")
    @expects("https://www.google.com/", "https://www.google.com")
    @expects("https://app.foobar.co.uk:1234/a=b", "https://app.foobar.co.uk:1234")
