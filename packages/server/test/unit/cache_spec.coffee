require("../spec_helper")

path      = require("path")
Promise   = require("bluebird")
cwd       = require("#{root}lib/cwd")
cache     = require("#{root}lib/cache")
fs        = require("#{root}lib/util/fs")
Fixtures  = require("../support/helpers/fixtures")

describe "lib/cache", ->
  beforeEach ->
    cache.remove()

  context "#_applyRewriteRules", ->
    beforeEach ->
      fs.readJsonAsync(Fixtures.path("server/old_cache.json")).then (@oldCache) =>

    it "converts object to array of paths", ->
      obj = cache._applyRewriteRules(@oldCache)
      expect(obj).to.deep.eq({
        USER: {name: "brian", sessionToken: "abc123"}
        PROJECTS: [
          "/Users/bmann/Dev/examples-angular-circle-ci"
          "/Users/bmann/Dev/cypress-core-gui"
          "/Users/bmann/Dev/cypress-app/spec/fixtures/projects/todos"
        ]
      })

    it "compacts non PATH values", ->
      obj = cache._applyRewriteRules({
        USER: {}
        PROJECTS: {
          one: { PATH: "foo/bar" }
          two: { FOO: "baz" }
        }
      })

      expect(obj).to.deep.eq({
        USER: {}
        PROJECTS: ["foo/bar"]
      })

    it "converts session_token to session_token", ->
      obj = cache._applyRewriteRules({
        USER: {id: 1, session_token: "abc123"}
        PROJECTS: []
      })

      expect(obj).to.deep.eq({
        USER: {id: 1, sessionToken: "abc123"}
        PROJECTS: []
      })

  context "projects", ->
    describe "#insertProject", ->
      it "inserts project by path", ->
        cache.insertProject("foo/bar")
        .then ->
          cache.__get("PROJECTS")
        .then (projects) ->
          expect(projects).to.deep.eq ["foo/bar"]

      it "inserts project at the start", ->
        cache.insertProject("foo")
        .then ->
          cache.insertProject("bar")
        .then ->
          cache.__get("PROJECTS")
        .then (projects) ->
          expect(projects).to.deep.eq ["bar", "foo"]

      it "can insert multiple projects in a row", ->
        Promise.all([
          cache.insertProject("baz")
          cache.insertProject("bar")
          cache.insertProject("foo")
        ])
        .then ->
          cache.__get("PROJECTS")
        .then (projects) ->
          expect(projects).to.deep.eq(["foo", "bar", "baz"])

      it "moves project to start if it already exists", ->
        Promise.all([
          cache.insertProject("foo")
          cache.insertProject("bar")
          cache.insertProject("baz")
        ])
        .then ->
          cache.insertProject("bar")
        .then ->
          cache.__get("PROJECTS")
        .then (projects) ->
          expect(projects).to.deep.eq ["bar", "baz", "foo"]

    describe "#removeProject", ->
      it "removes project by path", ->
        cache.insertProject("/Users/brian/app")
        .then =>
          cache.removeProject("/Users/brian/app")
        .then =>
          cache.__get("PROJECTS").then (projects) ->
            expect(projects).to.deep.eq []

    describe "#getProjectRoots", ->
      beforeEach ->
        @statAsync = sinon.stub(fs, "statAsync")

      it "returns an array of paths", ->
        @statAsync.withArgs("/Users/brian/app").resolves()
        @statAsync.withArgs("/Users/sam/app2").resolves()

        cache.insertProject("/Users/brian/app")
        .then =>
          cache.insertProject("/Users/sam/app2")
        .then =>
          cache.getProjectRoots().then (paths) ->
            expect(paths).to.deep.eq ["/Users/sam/app2", "/Users/brian/app"]

      it "removes any paths which no longer exist on the filesystem", ->
        @statAsync.withArgs("/Users/brian/app").resolves()
        @statAsync.withArgs("/Users/sam/app2").rejects(new Error())

        cache.insertProject("/Users/brian/app")
        .then =>
          cache.insertProject("/Users/sam/app2")
        .then =>
          cache.getProjectRoots().then (paths) =>
            expect(paths).to.deep.eq ["/Users/brian/app"]
        .then =>
          ## we have to wait on the write event because
          ## of process.nextTick
          Promise.delay(100).then =>
            cache.__get("PROJECTS").then (projects) ->
              expect(projects).to.deep.eq ["/Users/brian/app"]

  context "#setUser / #getUser", ->
    beforeEach ->
      @user = {
        id: 1
        name: "brian"
        email: "a@b.com"
        authToken: "1111-2222-3333-4444"
      }

    it "sets and gets user", ->
      cache.setUser(@user).then =>
        cache.getUser().then (user) =>
          expect(user).to.deep.eq(@user)

  context "#removeUser", ->
    it "sets user to empty object", ->
      cache.setUser(@user).then =>
        cache.removeUser().then =>
          cache.getUser().then (user) ->
            expect(user).to.deep.eq({})

  context "queues public methods", ->
    it "is able to write both values", ->
      Promise.all([
        cache.setUser({name: "brian", authToken: "auth-token-123"}),
        cache.insertProject("foo")
      ])
      .then ->
        cache.read()
      .then (json) ->
        expect(json).to.deep.eq({
          USER: {
            name: "brian"
            authToken: "auth-token-123"
          }
          PROJECTS: ["foo"]
        })
