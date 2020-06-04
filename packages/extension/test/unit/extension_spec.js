/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

let {
  exec
} = require("child_process");
let fs        = require("fs-extra");
const EE        = require("events");
const eol       = require("eol");
const path      = require("path");
const Promise   = require("bluebird");
const extension = require("../../index");

const cwd = process.cwd();
fs = Promise.promisifyAll(fs);
exec = Promise.promisify(exec);

describe("Extension", function() {
  context(".getCookieUrl", () => it("returns cookie url", () => expect(extension.getCookieUrl({
    name: "foo",
    value: "bar",
    path: "/foo/bar",
    domain: "www.google.com",
    secure: true
  })).to.eq("https://www.google.com/foo/bar")));

  context(".getPathToExtension", function() {
    it("returns path to dist", function() {
      const result = extension.getPathToExtension();
      const expected = path.join(cwd, "dist");
      return expect(path.normalize(result)).to.eq(path.normalize(expected));
    });

    return it("returns path to files in dist", function() {
      const result = extension.getPathToExtension("background.js");
      const expected = path.join(cwd, "/dist/background.js");
      return expect(path.normalize(result)).to.eq(path.normalize(expected));
    });
  });

  context(".getPathToTheme", () => it("returns path to theme", function() {
    const result = extension.getPathToTheme();
    const expected = path.join(cwd, "theme");
    return expect(path.normalize(result)).to.eq(path.normalize(expected));
  }));

  context(".getPathToRoot", () => it("returns path to root", () => expect(extension.getPathToRoot()).to.eq(cwd)));

  context(".setHostAndPath", function() {
    beforeEach(function() {
      this.src = path.join(cwd, "test", "helpers", "background.js");

      return sinon.stub(extension, "getPathToExtension")
      .withArgs("background.js").returns(this.src);
    });

    it("rewrites the background.js source", () => extension.setHostAndPath("http://dev.local:8080", "/__foo")
    .then(function(str) {
      const result = eol.auto(str);
      const expected = eol.auto(`\
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
\
`
      );
      return expect(result).to.eq(expected);
    }));

    return it("does not mutate background.js", function() {
      return fs.readFileAsync(this.src, "utf8")
      .then(str => {
        return extension.setHostAndPath("http://dev.local:8080", "/__foo")
        .then(() => {
          return fs.readFileAsync(this.src, "utf8");
      }).then(str2 => expect(str).to.eq(str2));
      });
    });
  });

  return context("manifest", () => it("has a key that resolves to the static extension ID", () => fs.readJsonAsync(path.join(cwd, "app/manifest.json"))
  .then(function(manifest) {
    const cmd = `echo \"${manifest.key}\" | openssl base64 -d -A | shasum -a 256 | head -c32 | tr 0-9a-f a-p`;
    return exec(cmd)
    .then(stdout => expect(stdout).to.eq("caljajdfkjjjdehjdoimjkkakekklcck"));
  })));
});
