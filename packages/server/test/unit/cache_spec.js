/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const path      = require("path");
const Promise   = require("bluebird");
const cwd       = require(`${root}lib/cwd`);
const cache     = require(`${root}lib/cache`);
const fs        = require(`${root}lib/util/fs`);
const Fixtures  = require("../support/helpers/fixtures");

describe("lib/cache", function() {
  beforeEach(() => cache.remove());

  context("#_applyRewriteRules", function() {
    beforeEach(function() {
      return fs.readJsonAsync(Fixtures.path("server/old_cache.json")).then(oldCache => {
        this.oldCache = oldCache;
        
    });
    });

    it("converts object to array of paths", function() {
      const obj = cache._applyRewriteRules(this.oldCache);
      return expect(obj).to.deep.eq({
        USER: {name: "brian", sessionToken: "abc123"},
        PROJECTS: [
          "/Users/bmann/Dev/examples-angular-circle-ci",
          "/Users/bmann/Dev/cypress-core-gui",
          "/Users/bmann/Dev/cypress-app/spec/fixtures/projects/todos"
        ]
      });
    });

    it("compacts non PATH values", function() {
      const obj = cache._applyRewriteRules({
        USER: {},
        PROJECTS: {
          one: { PATH: "foo/bar" },
          two: { FOO: "baz" }
        }
      });

      return expect(obj).to.deep.eq({
        USER: {},
        PROJECTS: ["foo/bar"]
      });
    });

    return it("converts session_token to session_token", function() {
      const obj = cache._applyRewriteRules({
        USER: {id: 1, session_token: "abc123"},
        PROJECTS: []
      });

      return expect(obj).to.deep.eq({
        USER: {id: 1, sessionToken: "abc123"},
        PROJECTS: []
      });
    });
  });

  context("projects", function() {
    describe("#insertProject", function() {
      it("inserts project by path", () => cache.insertProject("foo/bar")
      .then(() => cache.__get("PROJECTS")).then(projects => expect(projects).to.deep.eq(["foo/bar"])));

      it("inserts project at the start", () => cache.insertProject("foo")
      .then(() => cache.insertProject("bar")).then(() => cache.__get("PROJECTS")).then(projects => expect(projects).to.deep.eq(["bar", "foo"])));

      it("can insert multiple projects in a row", () => Promise.all([
        cache.insertProject("baz"),
        cache.insertProject("bar"),
        cache.insertProject("foo")
      ])
      .then(() => cache.__get("PROJECTS")).then(projects => expect(projects).to.deep.eq(["foo", "bar", "baz"])));

      return it("moves project to start if it already exists", () => Promise.all([
        cache.insertProject("foo"),
        cache.insertProject("bar"),
        cache.insertProject("baz")
      ])
      .then(() => cache.insertProject("bar")).then(() => cache.__get("PROJECTS")).then(projects => expect(projects).to.deep.eq(["bar", "baz", "foo"])));
  });

    describe("#removeProject", () => it("removes project by path", () => cache.insertProject("/Users/brian/app")
    .then(() => {
      return cache.removeProject("/Users/brian/app");
  }).then(() => {
      return cache.__get("PROJECTS").then(projects => expect(projects).to.deep.eq([]));
    })));

    return describe("#getProjectRoots", function() {
      beforeEach(function() {
        return this.statAsync = sinon.stub(fs, "statAsync");
      });

      it("returns an array of paths", function() {
        this.statAsync.withArgs("/Users/brian/app").resolves();
        this.statAsync.withArgs("/Users/sam/app2").resolves();

        return cache.insertProject("/Users/brian/app")
        .then(() => {
          return cache.insertProject("/Users/sam/app2");
      }).then(() => {
          return cache.getProjectRoots().then(paths => expect(paths).to.deep.eq(["/Users/sam/app2", "/Users/brian/app"]));
        });
    });

      return it("removes any paths which no longer exist on the filesystem", function() {
        this.statAsync.withArgs("/Users/brian/app").resolves();
        this.statAsync.withArgs("/Users/sam/app2").rejects(new Error());

        return cache.insertProject("/Users/brian/app")
        .then(() => {
          return cache.insertProject("/Users/sam/app2");
      }).then(() => {
          return cache.getProjectRoots().then(paths => {
            return expect(paths).to.deep.eq(["/Users/brian/app"]);
        });
        })
        .then(() => {
          //# we have to wait on the write event because
          //# of process.nextTick
          return Promise.delay(100).then(() => {
            return cache.__get("PROJECTS").then(projects => expect(projects).to.deep.eq(["/Users/brian/app"]));
        });
      });
    });
  });
});

  context("#setUser / #getUser", function() {
    beforeEach(function() {
      return this.user = {
        id: 1,
        name: "brian",
        email: "a@b.com",
        authToken: "1111-2222-3333-4444"
      };});

    return it("sets and gets user", function() {
      return cache.setUser(this.user).then(() => {
        return cache.getUser().then(user => {
          return expect(user).to.deep.eq(this.user);
        });
      });
    });
  });

  context("#removeUser", () => it("sets user to empty object", function() {
    return cache.setUser(this.user).then(() => {
      return cache.removeUser().then(() => {
        return cache.getUser().then(user => expect(user).to.deep.eq({}));
      });
    });
  }));

  return context("queues public methods", () => it("is able to write both values", () => Promise.all([
    cache.setUser({name: "brian", authToken: "auth-token-123"}),
    cache.insertProject("foo")
  ])
  .then(() => cache.read()).then(json => expect(json).to.deep.eq({
    USER: {
      name: "brian",
      authToken: "auth-token-123"
    },
    PROJECTS: ["foo"]
  }))));
});
