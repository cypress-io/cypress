require("../spec_helper")

UrlHelpers = require('../../../lib/util/url_helpers')

describe "Url helpers", ->
  context "#isFile", ->
    it "isFile is true", ->
      expect(UrlHelpers.isFile("file://foo.txt")).to.be.true

    it "isAbsolute is false", ->
      expect(UrlHelpers.isAbsolute("file://foo.txt")).to.be.false

    it "isRelative is false", ->
      expect(UrlHelpers.isRelative("file://foo.txt")).to.be.false

  context "#isAbsolute", ->
    it "isFile is false", ->
      expect(UrlHelpers.isFile("http://www.github.com")).to.be.false

    it "isAbsolute is false", ->
      expect(UrlHelpers.isAbsolute("http://www.github.com")).to.be.true

    it "isRelative is false", ->
      expect(UrlHelpers.isRelative("http://www.github.com")).to.be.false

  context "#isRelative", ->
    it "isFile is false", ->
      expect(UrlHelpers.isFile("bob/jones")).to.be.false

    it "isAbsolute is false", ->
      expect(UrlHelpers.isAbsolute("bob/jones")).to.be.false

    it "isRelative is true", ->
      expect(UrlHelpers.isRelative("bob/jones")).to.be.true

    it "isFile is false on leading slash", ->
      expect(UrlHelpers.isFile("/bob/jones")).to.be.false

    it "isAbsolute is false on leading slash", ->
      expect(UrlHelpers.isAbsolute("/bob/jones")).to.be.false

    it "isRelative is true on leading slash", ->
      expect(UrlHelpers.isRelative("/bob/jones")).to.be.true

  describe "#detectScheme", ->
    it "detects file urls", ->
      expect(UrlHelpers.detectScheme('file:///usr/lib/pron')).to.eq('file')

    it "detects absolute urls", ->
      expect(UrlHelpers.detectScheme('http://www.google.com')).to.eq('absolute')

    it "detects relative paths", ->
      expect(UrlHelpers.detectScheme('/usr/lib/dogecoin/vault.txt')).to.eq('relative')

  describe "#replaceHost", ->
    it "replaces original host with remoteHost", ->
      original = "http://localhost:2020/foo/bar.html?q=asdf#foo"
      remoteHost = "https://www.github.com"
      expect(UrlHelpers.replaceHost(original, remoteHost)).to.eq "https://www.github.com/foo/bar.html?q=asdf#foo"

  describe "#getOriginFromFqdnUrl", ->
    beforeEach ->
      @urlIs = (url, expected) ->
        url = UrlHelpers.getOriginFromFqdnUrl(url)
        expect(url).to.eq expected

    it "returns origin from a FQDN url", ->
      @urlIs "/http://www.google.com", "http://www.google.com"

    it "omits pathname, search, hash", ->
      @urlIs "/http://www.google.com/my/path?foo=bar#hash/baz", "http://www.google.com"

    it "returns undefined if not FQDN url", ->
      @urlIs "/foo/bar?baz=quux#hash/foo", undefined