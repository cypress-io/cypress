require("../spec_helper")

exec      = require("child_process").exec
fs        = require("fs-extra")
EE        = require("events")
eol       = require("eol")
path      = require("path")
Promise   = require("bluebird")
{ client } = require("@packages/socket/lib/browser")
extension = require("../../index")
Background = require("../../app/background")

cwd = process.cwd()
fs = Promise.promisifyAll(fs)
exec = Promise.promisify(exec)

describe "Extension", ->
  context ".connect", ->
    it "does not automatically connect outside of extension", ->
      sinon.stub(global, "chrome").value(undefined)
      sinon.stub(client, "connect").returns(new EE)
      
      Background()
      
      expect(client.connect).not.to.be.called

      sinon.stub(global, "chrome").value({})

      Background()
      
      expect(client.connect).to.be.called
  
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

      sinon.stub(extension, "getPathToExtension")
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

  context "manifest", ->
    it "has a key that resolves to the static extension ID", ->
      fs.readJsonAsync(path.join(cwd, "app/manifest.json"))
      .then (manifest) ->
        cmd = "echo \"#{manifest.key}\" | openssl base64 -d -A | shasum -a 256 | head -c32 | tr 0-9a-f a-p"
        exec(cmd)
        .then (stdout) ->
          expect(stdout).to.eq("caljajdfkjjjdehjdoimjkkakekklcck")
