root          = '../../../'
path          = require 'path'
Promise       = require 'bluebird'
expect        = require('chai').expect
Keys          = require "#{root}lib/keys"
Project       = require "#{root}lib/project"
cache         = require "#{root}lib/cache"
Settings      = require "#{root}lib/util/settings"
Routes        = require "#{root}lib/util/routes"
fs            = require 'fs-extra'
nock          = require 'nock'
sinon         = require 'sinon'
sinonPromise  = require 'sinon-as-promised'

describe "Cache", ->
  beforeEach ->
    nock.disableNetConnect()
    @sandbox = sinon.sandbox.create()
    @cache = cache

  afterEach ->
    nock.cleanAll()
    nock.enableNetConnect()
    @sandbox.restore()
    @cache.remove()

  context "#ensureExists", ->
    it "creates empty cache file", ->
      @cache.ensureExists().then =>
        fs.readJsonAsync(@cache.path).then (json) ->
          expect(json).to.deep.eq {}

    it "creates cache file in root/.cy/{environment}/cache", ->
      @cache.ensureExists().then ->
        fs.statAsync(path.join(process.cwd(), ".cy", process.env["NODE_ENV"], "cache"))

  context "validators", ->
    beforeEach ->
      @cache.ensureExists()

    it "creates an empty PROJECTS key", (done) ->
      @cache.read()
      .then (contents) ->
        expect(contents).to.deep.eq({PROJECTS: {}})
        done()
      .catch(done)

    it "creates an empty RANGE key for a Project", (done) ->
      @cache.insertProject("FOO")
      .then => @cache.read()
      .then (contents) =>
        expect(contents).to.deep.eq({
          PROJECTS: {FOO: {RANGE: {}}}
        })
        done()
      .catch(done)

  context "#ensureProject", ->
    it "returns project id if existing", ->
      @sandbox.stub(@cache, "getProject").resolves({"123-abc-foo-bar-baz": {}})
      insertProject = @sandbox.spy @cache, "insertProject"

      @cache.ensureProject("123-abc-foo-bar-baz").then (project) ->
        expect(project).to.deep.eq {"123-abc-foo-bar-baz": {}}
        expect(insertProject).not.to.be.called

    it "inserts project and returns id if not existing", ->
      @sandbox.stub(@cache, "getProject").rejects()
      insertProject = @sandbox.stub(@cache, "insertProject")

      @cache.ensureProject("123-abc-foo-bar-baz").then ->
        expect(insertProject).to.be.calledOnce

  context "projects", ->
    beforeEach ->
      @cache.ensureExists()

    describe "#getProject", ->
      it "returns the project by id", (done) ->
        @cache.insertProject("FOO").then (project) =>
          @cache.getProject("FOO").then (project) ->
            expect(project).to.deep.eq {RANGE: {}}
            done()
        .catch(done)

      it "throws an error when a project is not found", (done) ->
        @cache.getProject("FOO")
        .catch (err) ->
          expect(err.message).to.eq("Project FOO not found")
          done()

    describe "#insertProject", ->
      it "throws without an id", ->
        fn = => @cache.insertProject(null)
        expect(fn).to.throw("Cannot insert a project without an id!")

      it "inserts project by id", (done) ->
        @cache.insertProject(12345).then =>
          @cache.getProject(12345).then (project) ->
            expect(project).to.deep.eq {RANGE: {}}
            done()

      it "is a noop if project already exists by id", (done) ->
        @cache.insertProject(12345)
        .then =>
          @cache.updateProject(12345, {foo: "foo"}).then (@project) =>
            expect(@project).to.deep.eq {RANGE: {}, foo: "foo"}
        .then =>
          @cache.insertProject(12345).then =>
            expect(@project).to.deep.eq {RANGE: {}, foo: "foo"}
            done()

      it "can insert multiple projects", (done) ->
        insert = (id) =>
          @cache.insertProject(id)

        insert(123).then =>
          insert(456).then =>
            insert(789).then =>
              @cache.getProjects().then (projects) ->
                expect(projects).to.have.keys ["123", "456", "789"]
                done()
        .catch(done)

    describe "#addProject", ->
      context "with existing id", ->
        beforeEach ->
          @sandbox.stub(Project.prototype, "getProjectId").resolves("abc-123")

        it "inserts project", (done) ->
          @cache.addProject("/Users/brian/app").then (project) ->
            expect(project).to.deep.eq({RANGE: {}, PATH: "/Users/brian/app"})
            done()

        it "updates its path without affecting other keys", (done) ->
          @cache.insertProject("abc-123").then =>
            @cache.updateProject("abc-123", {foo: "foo", PATH: "/Users/dev/foo"}).then (project) ->
              expect(project).to.deep.eq({RANGE: {}, foo: "foo", PATH: "/Users/dev/foo"})
          .then =>
            @cache.addProject("/Users/brian/app").then (project) ->
              expect(project).to.deep.eq({RANGE: {}, foo: "foo", PATH: "/Users/brian/app"})
              done()

        it "returns the project when exists", (done) ->
          @cache.addProject("/Users/brian/app").then (project) ->
            expect(project.PATH).to.eq "/Users/brian/app"
            done()

      context "without existing id", ->
        beforeEach ->
          @sandbox.stub(Project.prototype, "createProjectId").returns("foo-bar-baz-123")
          @sandbox.stub(Settings, "read").resolves({})

        it "inserts projects", (done) ->
          @cache.addProject("/Users/brian/app").then =>
            @cache.getProjects().then (projects) ->
              expect(projects).to.have.property("foo-bar-baz-123")
              done()

        it "inserts project path", (done) ->
          @cache.addProject("/Users/brian/app").then (project) ->
            expect(project).to.deep.eq({RANGE: {}, PATH: "/Users/brian/app"})
            done()

    describe "#updateProject", ->
      beforeEach ->
        @cache.insertProject("BAR")

      it "can update a single project", (done) ->
        @cache.updateProject("BAR", {wow: 1})
        .then (c) ->
          expect(c).to.deep.eq({RANGE: {}, wow: 1})
          done()
        .catch(done)

      it "can update a project range", (done) ->
        @cache.updateRange("BAR", {start: 1, end: 2})
        .then (p) =>
          expect(p).to.deep.eq({RANGE: {start:1,end:2}})
          done()
        .catch(done)

      it "overrides only conflicting properties", (done) ->
        @cache.updateProject("BAR", {bar: "bar", foo: "foo"}).then =>
          @cache.updateProject("BAR", {bar: "baz"}).then (project) =>
            expect(project).to.have.property("foo", "foo")
            expect(project).to.have.property("bar", "baz")
            done()
        .catch(done)

    describe "#getProjectPaths", ->
      it "returns an array of paths", (done) ->
        stubId = (id) =>
          @sandbox.restore()
          @sandbox.stub(Project.prototype, "getProjectId").resolves(id)
          @sandbox.stub(fs, "statAsync").resolves()

        stubId("abc-123")
        @cache.addProject("/Users/brian/app").then =>
          stubId("foo-bar-456")
          @cache.addProject("/Users/sam/app2").then =>
            @cache.getProjectPaths().then (paths) ->
              expect(paths).to.deep.eq ["/Users/brian/app", "/Users/sam/app2"]
              done()
        .catch(done)

      it "removes any paths which no longer exist on the filesystem", (done) ->
        stubId = (id) =>
          @sandbox.restore()
          @sandbox.stub(Project.prototype, "getProjectId").resolves(id)
          @sandbox.stub(@cache, "ensureExists").resolves()
          @sandbox.stub(fs, "statAsync")
            .withArgs("/Users/brian/app").resolves()
            .withArgs("/Users/sam/app2").rejects()

        stubId("abc-123")
        @cache.addProject("/Users/brian/app").then =>
          stubId("foo-bar-456")
          @cache.addProject("/Users/sam/app2").then =>
            @cache.getProjectPaths().then (paths) =>
              expect(paths).to.deep.eq ["/Users/brian/app"]

              ## we have to wait on the write event because
              ## of process.nextTick
              @cache.once "write", -> done()

    describe "#_removeProjectByPath", ->
      it "removes projects by path", (done) ->
        stubId = (id) =>
          @sandbox.restore()
          @sandbox.stub(Project.prototype, "getProjectId").resolves(id)
        stubId(123)
        @cache.addProject("/Users/brian/app").then =>
          stubId(456)
          @cache.addProject("/Users/sam/app2").then =>
            @cache.getProjects().then (projects) =>
              @cache._removeProjectByPath(projects, "/Users/sam/app2").then =>
                @cache.getProjects().then (projects) ->
                  expect(projects).not.to.have.property(456)
                  done()
          .catch(done)

  context "utilities", ->
    it "can remove a single project"

  context "sessions", ->
    describe "#getUser", ->
      beforeEach ->
        @cache.ensureExists()

      it "returns session id", ->
        setUser = {id: 1, name: "brian", email: "a@b.com", session_token: "abc"}
        @cache.setUser(setUser).then =>
          @cache.getUser().then (user) ->
            expect(user).to.deep.eq setUser

    describe "#setUser", ->
      beforeEach ->
        @cache.ensureExists()

      it "sets USER into .cy", ->
        setUser = {id: 1, name: "brian", email: "a@b.com", session_token: "abc"}
        @cache.setUser(setUser).then (contents) ->
          expect(contents.USER).to.eq setUser

  context "setters + getters", ->
    describe "#_set", ->
      beforeEach ->
        @cache.ensureExists()

      it "does not override existing properties", (done) ->
        @cache._write({foo: "foo"}).then (contents) =>
          @cache._set({bar: "bar"}).then (contents) ->
            expect(contents.foo).to.eq "foo"
            expect(contents.bar).to.eq "bar"
            done()
        .catch(done)

  context "#logIn", ->
    beforeEach ->
      @user = {
        id: 1
        name: "brian"
        email: "a@b.com"
        session_token: "1111-2222-3333-4444"
      }

      @signin = nock(Routes.api())
      .post("/signin?code=abc123")
      .reply(200, @user)

    it "requests to api /signin", ->
      @cache.logIn("abc123").bind(@).then ->
        @signin.done()

    it "parses the resulting JSON", ->
      @cache.logIn("abc123").bind(@).then (user) ->
        expect(user).to.deep.eq(@user)

  context "#logOut", ->
    beforeEach ->
      @signout = nock(Routes.api())
      .post("/signout")
      .matchHeader("X-Session", "abc123")
      .reply(200)

      @cache.ensureExists()

    it "requests to api /signout", ->
      @cache.logOut("abc123").then =>
        @signout.done()

    it "nukes session_token from cache", ->
      setUser = {id: 1, name: "brian", email: "a@b.com", session_token: "abc123"}
      @cache.setUser(setUser).bind(@).then ->
        @cache.logOut("abc123").bind(@).then ->
          @cache.getUser().then (user) ->
            expect(user.session_token).to.be.null

    it "nukes session_token from cache even on error", ->
      @signout = nock(Routes.api())
      .post("/signout")
      .matchHeader("X-Session", "abc123")
      .reply(401)

      setUser = {id: 1, name: "brian", email: "a@b.com", session_token: "abc123"}
      @cache.setUser(setUser).bind(@).then ->
        @cache.logOut("abc123").bind(@).then ->
          @cache.getUser().then (user) ->
            expect(user.session_token).to.be.null