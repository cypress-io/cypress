require("../spec_helper")

delete global.fs

tar         = require("tar-fs")
mock        = require("mock-fs")
Updater     = require("#{root}lib/updater")
Fixtures    = require("#{root}/spec/server/helpers/fixtures")

describe "lib/updater", ->
  afterEach ->
    Updater.setCoords(null)
    mock.restore()

  context "interface", ->
    it "returns an updater instance", ->
      u = Updater({})
      expect(u).to.be.instanceof Updater

  context "#getPackage", ->
    beforeEach ->
      mock({
        "package.json": JSON.stringify(foo: "bar")
      })

      @updater = Updater({})

    it "inserts manifestUrl to package.json", ->
      expect(@updater.getPackage()).to.deep.eq {
        foo: "bar"
        manifestUrl: "https://download.cypress.io/desktop.json"
      }

  context "#getClient", ->
    it "sets .client to new Updater", ->
      u = Updater({})
      u.getClient()
      expect(u.client).to.have.property("checkNewVersion")

    it "returns .client if exists", ->
      u = Updater({})
      client  = u.getClient()
      client2 = u.getClient()
      expect(client).to.eq(client2)

  context "#getCoords", ->
    beforeEach ->
      @updater = Updater({})

    it "returns undefined without coords", ->
      expect(@updater.getCoords()).to.be.undefined

    it "returns --coords=800x600", ->
      Updater.setCoords {x: 800, y: 600}
      expect(@updater.getCoords()).to.eq "--coords=800x600"

  context "#getArgs", ->
    beforeEach ->
      @updater = Updater({})
      @updater.getClient()
      @sandbox.stub(@updater.client, "getAppPath").returns("foo")
      @sandbox.stub(@updater.client, "getAppExec").returns("bar")

    it "compacts null values", ->
      expect(@updater.getArgs()).to.deep.eq ["--app-path=foo", "--exec-path=bar", "--updating"]

  context ".run", ->
    beforeEach ->
      @updater = Updater({})
      @updater.getClient()
      @checkNewVersion = @sandbox.stub(@updater.client, "checkNewVersion")
      @sandbox.stub(process, "exit")

    it "invokes onRun", ->
      spy = @sandbox.spy()
      Updater.run({onStart: spy})
      expect(spy).to.be.called

    describe "client#checkNewVersion", ->
      beforeEach ->
        @download = @sandbox.stub(Updater.prototype, "download")

      it "is called once", ->
        @updater.run()
        expect(@checkNewVersion).to.be.calledOnce

      it "calls #download if new version exists", ->
        @checkNewVersion.yields(null, true, {})
        @updater.run()
        expect(@download).to.be.calledOnce

      it "passes manifest to #download when new version exists", ->
        @checkNewVersion.yields(null, true, {foo: "bar"})
        @updater.run()
        expect(@download).to.be.calledWith({foo: "bar"})

      it "does not call #download if there isnt a new version", ->
        @checkNewVersion.yields(null, false, {foo: "bar"})
        @updater.run()
        expect(@download).not.to.be.called

      it "invokes onNone when there isnt a new version", ->
        spy = @sandbox.spy()
        @checkNewVersion.yields(null, false)
        @updater.callbacks.onNone = spy
        @updater.run()
        expect(spy).to.be.called

      it "does not call #download if there is an error", ->
        @checkNewVersion.yields((new Error), true, {foo: "bar"})
        @updater.run()
        expect(@download).not.to.be.called

      it "invokes onError callbacks", ->
        err = new Error("checking onError")
        spy = @sandbox.spy()
        @checkNewVersion.yields(err)
        @updater.callbacks.onError = spy
        @updater.run()
        expect(spy).to.be.calledWith(err)

    describe "#download", ->
      beforeEach ->
        @sandbox.stub(@updater.client, "download")
        @sandbox.stub(@updater, "unpack")
        @clock = @sandbox.useFakeTimers()

      it "invokes onDownload", ->
        spy = @sandbox.spy()
        @updater.callbacks.onDownload = spy
        @updater.download({})
        @clock.tick(1000)
        expect(spy).to.be.called

      it "calls unpack with destinationPath and manifest", ->
        @updater.client.download.yields(null, "/Users/bmann/app")
        @updater.download({})
        @clock.tick(1000)
        expect(@updater.unpack).to.be.calledOnce.and.to.be.calledWith("/Users/bmann/app", {})

      it "does not call unpack on error", ->
        @updater.client.download.yields((new Error), "/Users/bmann/app")
        @updater.download({})
        @clock.tick(1000)
        expect(@updater.unpack).not.to.be.called

      it "invokes onError callbacks", ->
        err = new Error("checking onError")
        spy = @sandbox.spy()
        @updater.callbacks.onError = spy
        @updater.client.download.yields(err)
        @updater.download({})
        @clock.tick(1000)
        expect(spy).to.be.calledWith(err)

    describe "#unpack", ->
      beforeEach ->
        @sandbox.stub(@updater.client, "unpack")
        @sandbox.stub(@updater, "runInstaller")

      it "invokes onApply", ->
        spy = @sandbox.spy()
        @updater.callbacks.onApply = spy
        @updater.unpack("/some/path", {})
        expect(spy).to.be.called

      it "calls runInstaller with newAppPath", ->
        @updater.client.unpack.yields(null, "/Users/bmann/app")
        @updater.unpack("/some/path", {})
        expect(@updater.runInstaller).to.be.calledOnce.and.to.be.calledWith("/Users/bmann/app")

      it "does not call runInstaller on error", ->
        @updater.client.unpack.yields((new Error), "/Users/bmann/app")
        @updater.unpack("/some/path", {})
        expect(@updater.runInstaller).not.to.be.called

      it "invokes onError callbacks", ->
        err = new Error("checking onError")
        spy = @sandbox.spy()
        @updater.callbacks.onError = spy
        @updater.client.unpack.yields(err)
        @updater.unpack("/some/path", {})
        expect(spy).to.be.calledWith(err)

    describe "#runInstaller", ->
      beforeEach ->
        @sandbox.stub(@updater.client, "runInstaller")
        # @sandbox.stub(@updater,        "copyCyDataTo").resolves()

      it "calls process.exit", ->
        @updater.runInstaller("/Users/bmann/newApp")
        expect(process.exit).to.be.calledOnce

      it "calls runInstaller on the client", ->
        c = @updater.client
        @updater.runInstaller("/Users/bmann/newApp")

        expect(@updater.client.runInstaller).to.be.calledWith("/Users/bmann/newApp", ["--app-path=#{c.getAppPath()}", "--exec-path=#{c.getAppExec()}", "--updating"], {})

      ## we no longer pass up additional App argv
      ## other than from debug i'm not sure why we
      ## would have ever wanted to do this. in fact
      ## its caused a bug in parseArgs and its duplicated
      ## every existing argument
      it "does not pass along additional App argv", ->
        c = @updater.client
        @updater.runInstaller("/Users/bmann/newApp")
        expect(@updater.client.runInstaller).to.be.calledWith("/Users/bmann/newApp", ["--app-path=#{c.getAppPath()}", "--exec-path=#{c.getAppExec()}", "--updating"], {})

      it "passes along App.coords if they exist", ->
        Updater.setCoords {x: 600, y: 1200}
        c = @updater.client
        @updater.runInstaller("/Users/bmann/newApp")
        expect(@updater.client.runInstaller).to.be.calledWith("/Users/bmann/newApp", ["--app-path=#{c.getAppPath()}", "--exec-path=#{c.getAppExec()}", "--updating", "--coords=600x1200"], {})

    describe "#copyCyDataTo", ->
      beforeEach ->
        fs.outputJsonAsync(".cy/cache", {foo: "bar"}).then ->
          fs.outputFileAsync(".cy/foo/bar.txt", "foo!").then ->
            fs.outputJsonAsync("new/app/path/Contents/Resources/app/package.json", {})

      afterEach ->
        fs.removeAsync("new").then ->
          fs.removeAsync(".cy/foo")

    describe "#copyTmpToAppPath", ->
      beforeEach ->
        @onStub = @sandbox.stub()
        @onStub.withArgs("error").returnsThis()

        @onPipe = @sandbox.stub().returnsThis()

        @sandbox.stub(tar, "pack").returns({
          on: @onStub
          pipe: @onPipe
        })

        @sandbox.stub(tar, "extract").returns("extractFoo")

      it "calls tar.pack", ->
        @onStub.withArgs("finish").yieldsAsync()

        @updater.copyTmpToAppPath("a", "b").then ->
          expect(tar.pack).to.be.calledWith("a", {
            fs: require("original-fs")
          })

      it "calls tar.extract", ->
        @onStub.withArgs("finish").yieldsAsync()

        @updater.copyTmpToAppPath("a", "b").then ->
          expect(tar.extract).to.be.calledWith("b", {
            fs: require("original-fs")
          })

      it "pipes return value of tar.extract", ->
        @onStub.withArgs("finish").yieldsAsync()

        @updater.copyTmpToAppPath("a", "b").then =>
          expect(@onPipe).to.be.calledWith("extractFoo")

      it "throws on error", ->
        err = new Error("foo")
        @onStub.withArgs("error").yieldsAsync(err)

        @updater.copyTmpToAppPath("a", "b")
        .then ->
          throw new Error("should have failed but did not")
        .catch (e) ->
          expect(e).to.eq(err)

    describe "#trash", ->
      beforeEach ->
        fs.outputFileAsync("random/dirs/and/file.txt", "foobarbaz!")

      it "moves directory to trash", (done) ->
        @updater.trash("random").then ->
          fs.statAsync("random")
            .then -> done("random should not exist!")
            .catch -> done()

    describe "#install", ->
      beforeEach ->
        @argsObj = {
          appPath:  "/Users/bmann/app_path"
          execPath: "/Users/bmann/app_exec_path"
          _coords: "1x2"
          coords: {x: 1, y: 2}
        }

        @sandbox.stub(@updater.client, "getAppPath").returns("foo")
        @sandbox.stub(@updater, "copyTmpToAppPath").resolves()

        @run     = @sandbox.stub(@updater.client, "run")
        @trash   = @sandbox.stub(@updater, "trash").resolves()

      it "trashes current appPath", ->
        @updater.install(@argsObj).then =>
          expect(@trash).to.be.calledWith("/Users/bmann/app_path")

      it "calls #copyTmpToAppPath with tmp + appPath", ->
        @updater.install(@argsObj).then =>
          expect(@updater.copyTmpToAppPath).to.be.calledWith "foo", @argsObj.appPath

      it "calls process.exit", ->
        @updater.install(@argsObj).then =>
          expect(process.exit).to.be.calledOnce

      it "calls client.run with execPath + args", ->
        @updater.install(@argsObj).then =>
          expect(@run).to.be.calledWith(@argsObj.execPath, ["--coords=1x2"])

      context "args", ->
        beforeEach ->
          @argsObj = {
            updating: true
            appPath: "app"
            execPath: "exec"
            "getKey": true
          }

        it "uses args object", ->
          @updater.install(@argsObj).then =>
            expect(@run).to.be.calledWith("exec", ["--getKey=true"])

  context "integration", ->
    before ->
      ## 10 min timeout
      @timeout(10 * 60 * 1000)

      ## ensure we have the cypress.zip fixture
      Fixtures.ensureNwZip()

    beforeEach ->
      ## force a lower package.json version
      mock({
        "package.json": JSON.stringify(version: "0.0.1")
      })

      ## force a manifest.json response here to be a slightly higher version
      nock("http://download.cypress.io")
        .get("/desktop.json")
        .reply 200, {
          name: "cypress"
          version: "0.0.2"
          packages: {
            mac: {
              url: "http://cdn.cypress.io/desktop/0.0.2/cypress.zip"
            }
            win: {
              url: "http://cdn.cypress.io/desktop/0.0.2/cypress.zip"
            }
            linux: {
              url: "http://cdn.cypress.io/desktop/0.0.2/cypress.zip"
            }
          }
        }
        .get("/dist.cypress.io/0.0.2/cypress.zip")
        .reply 200, ->
          mock.restore()
          fs.createReadStream Fixtures.path("nw/cypress.zip")

    # it "runs", ->
    #   @updater = Updater({quit: @sandbox.spy()})
    #   @updater.run()

  context "#check", ->
    beforeEach ->
      @updater = Updater({quit: @sandbox.spy()})
      @updater.getClient()
      @sandbox.stub(@updater.client, "checkNewVersion")

    it "calls checkNewVersion", ->
      @updater.check()
      expect(@updater.client.checkNewVersion).to.be.called

    it "calls optsions.newVersionExists when there is a no version", ->
      @updater.client.checkNewVersion.yields(null, true, {})

      options = {onNewVersion: @sandbox.spy()}
      @updater.check(options)

      expect(options.onNewVersion).to.be.calledWith({})

    it "calls options.newVersionExists when there is a no version", ->
      @updater.client.checkNewVersion.yields(null, false)

      options = {onNoNewVersion: @sandbox.spy()}
      @updater.check(options)

      expect(options.onNoNewVersion).to.be.called
