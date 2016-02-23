require("../spec_helper")

path          = require("path")
Project       = require("#{root}lib/project")
cache         = require("#{root}lib/cache")
Settings      = require("#{root}lib/util/settings")
Routes        = require("#{root}lib/util/routes")

describe "lib/cache", ->
  beforeEach ->
    @cache = cache

  afterEach ->
    @cache.remove()

  context "#ensureExists", ->
    it "creates empty cache file with defaults", ->
      @cache.ensureExists().then =>
        fs.readJsonAsync(@cache.path).then (json) ->
          expect(json).to.deep.eq {
            USER: {}
            PROJECTS: {}
          }

    it "creates cache file in root/.cy/{environment}/cache", ->
      @cache.ensureExists().then ->
        fs.statAsync(path.join(process.cwd(), ".cy", process.env["CYPRESS_ENV"], "cache"))

  context "projects", ->
    beforeEach ->
      @cache.ensureExists()

    describe "#insertProject", ->
      it "throws without an id", ->
        fn = => @cache.insertProject(null)
        expect(fn).to.throw("Cannot insert a project without an id!")

      it "inserts project by id", ->
        @cache.insertProject(12345).then =>
          @cache.getProjects().then (projects) ->
            expect(projects).to.deep.eq {"12345": {}}

      it "is a noop if project already exists by id", ->
        @cache.insertProject(12345)
        .then =>
          @cache.updateProject(12345, "path/to/project").then (@project) =>
            expect(@project).to.deep.eq {PATH: "path/to/project"}
        .then =>
          @cache.insertProject(12345).then =>
            expect(@project).to.deep.eq {PATH: "path/to/project"}

      it "can insert multiple projects", ->
        insert = (id) =>
          @cache.insertProject(id)

        insert(123).then =>
          insert(456).then =>
            insert(789).then =>
              @cache.getProjects().then (projects) ->
                expect(projects).to.have.keys ["123", "456", "789"]

    describe "#removeProject", ->
      beforeEach ->
        @sandbox.stub(Project.prototype, "createProjectId").returns("foo-bar-baz-123")
        @sandbox.stub(Settings, "read").resolves({})

      it "removes project by path", ->
        Project.add("/Users/brian/app").then =>
          @cache.removeProject("/Users/brian/app").then =>
            @cache.getProjects().then (projects) ->
              expect(projects).to.deep.eq {}

    describe "#getProjectPaths", ->
      it "returns an array of paths", (done) ->
        stubId = (id) =>
          @sandbox.restore()
          @sandbox.stub(Project.prototype, "getProjectId").resolves(id)
          @sandbox.stub(fs, "statAsync").resolves()

        stubId("abc-123")
        Project.add("/Users/brian/app").then =>
          stubId("foo-bar-456")
          Project.add("/Users/sam/app2").then =>
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
            .withArgs("/Users/sam/app2").rejects(new Error)

        stubId("abc-123")
        Project.add("/Users/brian/app").then =>
          stubId("foo-bar-456")
          Project.add("/Users/sam/app2").then =>
            @cache.getProjectPaths().then (paths) =>
              expect(paths).to.deep.eq ["/Users/brian/app"]

              ## we have to wait on the write event because
              ## of process.nextTick
              Promise.delay(100).then =>
                @cache.getProjects().then (projects) ->
                  expect(projects).to.have.all.keys("abc-123")
                  done()

    describe "#_removeProjectByPath", ->
      it "removes projects by path", (done) ->
        stubId = (id) =>
          @sandbox.restore()
          @sandbox.stub(Project.prototype, "getProjectId").resolves(id)
        stubId(123)
        Project.add("/Users/brian/app").then =>
          stubId(456)
          Project.add("/Users/sam/app2").then =>
            @cache.getProjects().then (projects) =>
              @cache._removeProjectByPath(projects, "/Users/sam/app2").then =>
                @cache.getProjects().then (projects) ->
                  expect(projects).not.to.have.property(456)
                  done()
          .catch(done)

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
        @cache.write({foo: "foo"}).then (contents) =>
          @cache._set({bar: "bar"}).then (contents) ->
            expect(contents.foo).to.eq "foo"
            expect(contents.bar).to.eq "bar"
            done()
        .catch(done)

  context "#getUser / #setUser", ->
    beforeEach ->
      @user = {
        id: 1
        name: "brian"
        email: "a@b.com"
        session_token: "1111-2222-3333-4444"
      }

    it "sets and gets user", ->
      @cache.setUser(@user).then =>
        @cache.getUser().then (user) =>
          expect(user).to.deep.eq(@user)

  context "#removeUser", ->
    it "sets user to empty object", ->
      @cache.setUser(@user).then =>
        @cache.removeUser().then =>
          @cache.getUser().then (user) ->
            expect(user).to.deep.eq({})
