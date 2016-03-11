require("../spec_helper")

path      = require("path")
cwd       = require("#{root}lib/cwd")
cache     = require("#{root}lib/cache")
Fixtures  = require("../helpers/fixtures")

describe "lib/cache", ->
  context "#ensureExists", ->
    it "creates empty cache file with defaults", ->
      cache.ensureExists().then =>
        fs.readJsonAsync(cache.path).then (json) ->
          expect(json).to.deep.eq {
            USER: {}
            PROJECTS: []
          }

    it "detects when not defaults and automatically inserts PROJECTS", ->
      fs.writeJsonAsync(cache.path, {USER: {name: "brian"}})
      .then =>
        cache.ensureExists()
      .then =>
        fs.readJsonAsync(cache.path).then (json) ->
          expect(json).to.deep.eq {
            USER: {name: "brian"}
            PROJECTS: []
          }

    it "detects when not defaults and automatically inserts USER", ->
      fs.writeJsonAsync(cache.path, {PROJECTS: {asdf: "jkl"}})
      .then =>
        cache.ensureExists()
      .then =>
        fs.readJsonAsync(cache.path).then (json) ->
          expect(json).to.deep.eq {
            USER: {}
            PROJECTS: []
          }

    it "converts legacy cache projects to array", ->
      fs.writeFileAsync(cache.path, Fixtures.get("server/old_cache.json"))
      .then =>
        cache.ensureExists()
      .then =>
        fs.readJsonAsync(cache.path).then (json) ->
          expect(json).to.deep.eq {
            USER: {name: "brian"}
            PROJECTS: [
              "/Users/bmann/Dev/examples-angular-circle-ci"
              "/Users/bmann/Dev/cypress-gui"
              "/Users/bmann/Dev/cypress-app/spec/fixtures/projects/todos"
            ]
          }

    it "creates cache file in root/.cy/{environment}/cache", ->
      cache.ensureExists().then ->
        fs.statAsync(cwd(".cy", process.env["CYPRESS_ENV"], "cache"))

  context "#convertLegacyCache", ->
    beforeEach ->
      fs.readJsonAsync(Fixtures.path("server/old_cache.json")).then (@oldCache) =>

    it "converts object to array of paths", ->
      obj = cache.convertLegacyCache(@oldCache)
      expect(obj).to.deep.eq({
        USER: {name: "brian"}
        PROJECTS: [
          "/Users/bmann/Dev/examples-angular-circle-ci"
          "/Users/bmann/Dev/cypress-gui"
          "/Users/bmann/Dev/cypress-app/spec/fixtures/projects/todos"
        ]
      })

    it "compacts non PATH values", ->
      obj = cache.convertLegacyCache({
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

  context "projects", ->
    beforeEach ->
      cache.ensureExists()

    describe "#insertProject", ->
      it "inserts project by path", ->
        cache.insertProject("foo/bar").then =>
          cache._getProjects().then (projects) ->
            expect(projects).to.deep.eq ["foo/bar"]

      it "is a noop if project already exists by id", ->
        cache.insertProject("foo/bar")
        .then =>
          cache.insertProject("foo/bar")
        .then =>
          cache._getProjects().then (projects) ->
            expect(projects).to.deep.eq(["foo/bar"])

      it "can insert multiple projects", ->
        insert = (path) =>
          cache.insertProject(path)

        insert("foo")
        .then =>
          insert("bar")
        .then =>
          insert("baz")
        .then =>
          cache._getProjects().then (projects) ->
            expect(projects).to.deep.eq(["foo", "bar", "baz"])

    describe "#removeProject", ->
      it "removes project by path", ->
        cache.insertProject("/Users/brian/app")
        .then =>
          cache.removeProject("/Users/brian/app")
        .then =>
          cache._getProjects().then (projects) ->
            expect(projects).to.deep.eq []

    describe "#getProjectPaths", ->
      beforeEach ->
        @statAsync = @sandbox.stub(fs, "statAsync")

      it "returns an array of paths", ->
        @statAsync.withArgs("/Users/brian/app").resolves()
        @statAsync.withArgs("/Users/sam/app2").resolves()

        cache.insertProject("/Users/brian/app")
        .then =>
          cache.insertProject("/Users/sam/app2")
        .then =>
          cache.getProjectPaths().then (paths) ->
            expect(paths).to.deep.eq ["/Users/brian/app", "/Users/sam/app2"]

      it "removes any paths which no longer exist on the filesystem", ->
        @statAsync.withArgs("/Users/brian/app").resolves()
        @statAsync.withArgs("/Users/sam/app2").rejects(new Error)

        cache.insertProject("/Users/brian/app")
        .then =>
          cache.insertProject("/Users/sam/app2")
        .then =>
          cache.getProjectPaths().then (paths) =>
            expect(paths).to.deep.eq ["/Users/brian/app"]
        .then =>
          ## we have to wait on the write event because
          ## of process.nextTick
          Promise.delay(100).then =>
            cache._getProjects().then (projects) ->
              expect(projects).to.deep.eq ["/Users/brian/app"]

    describe "#_removeProjects", ->
      it "removes projects by path",  ->
        cache.insertProject("/Users/brian/app")
        .then =>
          cache.insertProject("/Users/sam/app2")
        .then =>
          cache._getProjects().then (projects) =>
            cache._removeProjects(projects, "/Users/sam/app2")
        .then =>
          cache._getProjects().then (projects) ->
            expect(projects).to.deep.eq ["/Users/brian/app"]

  context "sessions", ->
    describe "#getUser", ->
      beforeEach ->
        cache.ensureExists()

      it "returns session id", ->
        setUser = {id: 1, name: "brian", email: "a@b.com", session_token: "abc"}
        cache.setUser(setUser).then =>
          cache.getUser().then (user) ->
            expect(user).to.deep.eq setUser

    describe "#setUser", ->
      beforeEach ->
        cache.ensureExists()

      it "sets USER into .cy", ->
        setUser = {id: 1, name: "brian", email: "a@b.com", session_token: "abc"}
        cache.setUser(setUser).then (contents) ->
          expect(contents.USER).to.eq setUser

  context "setters + getters", ->
    describe "#_set", ->
      beforeEach ->
        cache.ensureExists()

      it "does not override existing properties", ->
        cache.write({foo: "foo"}).then (contents) =>
          cache._set({bar: "bar"}).then (contents) ->
            expect(contents.foo).to.eq "foo"
            expect(contents.bar).to.eq "bar"

  context "#getUser / #setUser", ->
    beforeEach ->
      @user = {
        id: 1
        name: "brian"
        email: "a@b.com"
        session_token: "1111-2222-3333-4444"
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
