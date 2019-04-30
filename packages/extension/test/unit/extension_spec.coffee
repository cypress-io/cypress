require("../spec_helper")

fs        = require("fs-extra")
path      = require("path")
Promise   = require("bluebird")
eol       = require("eol")
extension = require("../../index")
cwd       = process.cwd()

fs = Promise.promisifyAll(fs)

describe "Extension", ->
  context ".getCookieUrl", ->
    it "returns cookie url", ->
      expect(extension.getCookieUrl({
        name: "foo"
        value: "bar"
        path: "/foo/bar"
        domain: "www.google.com"
        secure: true
      })).to.eq("https://www.google.com/foo/bar")

  context ".getPathToExtension", ->
    it "returns path to dist", ->
      result = extension.getPathToExtension()
      expected = path.join(cwd, "dist")
      expect(path.normalize(result)).to.eq(path.normalize(expected))

    it "returns path to files in dist", ->
      result = extension.getPathToExtension("background.js")
      expected = path.join(cwd, "/dist/background.js")
      expect(path.normalize(result)).to.eq(path.normalize(expected))

  context ".getPathToTheme", ->
    it "returns path to theme", ->
      result = extension.getPathToTheme()
      expected = path.join(cwd, "theme")
      expect(path.normalize(result)).to.eq(path.normalize(expected))

  context ".getPathToRoot", ->
    it "returns path to root", ->
      expect(extension.getPathToRoot()).to.eq(cwd)

  context ".setHostAndPath", ->
    beforeEach ->
      @src = path.join(cwd, "test", "helpers", "background.js")

      @sandbox.stub(extension, "getPathToExtension")
      .withArgs("background.js").returns(@src)

    it "rewrites the background.js source", ->
      extension.setHostAndPath("http://dev.local:8080", "/__foo")
      .then (str) ->
        result = eol.auto(str)
        expected = eol.auto """
        (function() {
          var HOST, PATH, automation, client, fail, invoke,
            slice = [].slice;

          HOST = "http://dev.local:8080";

          PATH = "/__foo";

          client = io.connect(HOST, {
            path: PATH
          });

          automation = {
            getAllCookies: function(filter, fn) {
              if (filter == null) {
                filter = {};
              }
              return chrome.cookies.getAll(filter, fn);
            }
          };

        }).call(this);

        """
        expect(result).to.eq(expected)

    it "does not mutate background.js", ->
      fs.readFileAsync(@src, "utf8")
      .then (str) =>
        extension.setHostAndPath("http://dev.local:8080", "/__foo")
        .then =>
          fs.readFileAsync(@src, "utf8")
        .then (str2) ->
          expect(str).to.eq(str2)
