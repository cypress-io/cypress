require("../spec_helper")

fs        = require("fs-extra")
path      = require("path")
Promise   = require("bluebird")
extension = require("../../index")
cwd       = process.cwd()

fs = Promise.promisifyAll(fs)

describe "Extension", ->
  context ".getPathToExtension", ->
    it "returns path to dist", ->
      expect(extension.getPathToExtension()).to.eq(cwd + "/dist")

    it "returns path to files in dist", ->
      expect(extension.getPathToExtension("background.js")).to.eq(cwd + "/dist/background.js")

  context ".setHostAndPath", ->
    beforeEach ->
      @src  = path.join(cwd, "test", "helpers", "background_src.js")
      @dest = path.join(cwd, "test", "helpers", "background.js")

      @sandbox.stub(extension, "getPathToExtension")
        .withArgs("background.js").returns(@dest)
        .withArgs("background_src.js").returns(@src)

      fs.copyAsync(@src, @dest)

    it "rewrites the background.js source", ->
      extension.setHostAndPath("http://dev.local:8080", "/__foo")
      .then =>
        fs.readFileAsync(@dest, "utf8")
      .then (str) ->
        expect(str).to.eq """
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

    it "does not mutate background_src", ->
      fs.readFileAsync(@src, "utf8")
      .then (str) =>
        extension.setHostAndPath("http://dev.local:8080", "/__foo")
        .then =>
          fs.readFileAsync(@src, "utf8")
        .then (str2) ->
          expect(str).to.eq(str2)
