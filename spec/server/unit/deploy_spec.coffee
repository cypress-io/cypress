root          = "../../../"
path          = require "path"
expect        = require("chai").expect
Deploy        = require("#{root}lib/deploy")
Promise       = require "bluebird"
fs            = require "fs-extra"
gulp          = require "gulp"
glob          = require "glob"
sinon         = require "sinon"
sinonPromise  = require "sinon-as-promised"
child_process = require "child_process"
_             = require "lodash"
inquirer      = require "inquirer"

fs       = Promise.promisifyAll(fs)
prevCwd  = process.cwd()
distDir  = path.join(process.cwd(), "dist")
buildDir = path.join(process.cwd(), "build")

deploy = null

describe "Deploy", ->
  beforeEach ->
    deploy = Deploy()
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(child_process, "exec").callsArg(2)

  afterEach ->
    process.chdir(prevCwd)
    fs.removeSync(distDir)
    fs.removeSync(buildDir)

    @sandbox.restore()

  context "#prepare", ->
    it "creates dist folder", ->
      deploy.prepare().then ->
        isDir = fs.statSync(distDir).isDirectory()
        expect(isDir).to.be.true

    it "copies package.json to dist", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/package.json").isFile()).to.be.true

    it "copies config/app.yml to dist", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/config/app.yml").isFile()).to.be.true

    it "copies lib/cypress to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/cypress.coffee").isFile()).to.be.true

    it "copies lib/controllers to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/controllers").isDirectory()).to.be.true

    it "copies lib/util to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/util").isDirectory()).to.be.true

    it "copies lib/routes to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/routes").isDirectory()).to.be.true

    it "copies lib/cache to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/cache.coffee").isFile()).to.be.true

    it "copies lib/id_generator to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/id_generator.coffee").isFile()).to.be.true

    it "copies lib/keys to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/keys.coffee").isFile()).to.be.true

    it "copies lib/logger to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/logger.coffee").isFile()).to.be.true

    it "copies lib/project to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/project.coffee").isFile()).to.be.true

    it "copies lib/server to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/server.coffee").isFile()).to.be.true

    it "copies lib/socket to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/socket.coffee").isFile()).to.be.true

    it "copies lib/updater to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/updater.coffee").isFile()).to.be.true

    it "copies lib/environment to dist src", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/environment.coffee").isFile()).to.be.true

    it "copies lib/public to dist", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/lib/public").isDirectory()).to.be.true

    it "copies nw/public to dist", ->
      deploy.prepare().then ->
        expect(fs.statSync(distDir + "/nw/public").isDirectory()).to.be.true

    # it "copies spec/server to dist", ->
    #   @prepare().then ->
    #     expect(fs.statSync(distDir + "/spec/server").isDirectory()).to.be.true

    # it "omits deploy_spec from dist", (done) ->
    #   @prepare().then ->
    #     fs.statAsync(distDir + "/spec/server/unit/deploy_spec.coffee")
    #       .then -> done("should not find deploy_spec.coffee")
    #       .catch -> done()

  context "#convertToJs", ->
    beforeEach ->
      deploy.prepare()

    it "converts .coffee to .js", ->
      deploy.convertToJs().then ->
        coffeeFiles = glob.sync(distDir + "/src/**/*.coffee")
        jsFiles     = glob.sync(distDir + "/src/**/*.js")

        expect(coffeeFiles.length).to.eq(jsFiles.length)
        expect(coffeeFiles.length).to.be.gt(0)
        expect(jsFiles.length).to.be.gt(0)

  context "#obfuscate", ->
    beforeEach ->
      deploy.prepare().then(deploy.convertToJs)

    it "writes obfuscated js to dist/lib/cypress.js", ->
      deploy.obfuscate().then (obfuscated) ->
        cypress = fs.statSync(distDir + "/lib/cypress.js")
        expect(cypress.isFile()).to.be.true
        expect(obfuscated.length).to.be.gt(0)

  context "#cleanupSrc", ->
    beforeEach ->
      deploy.prepare()

    it "removes /dist/src", (done) ->
      ## we want to be sure statAsync throws
      ## because this should not be a directory
      deploy.cleanupSrc().then ->
        fs.statAsync(distDir + "/src")
          .then -> done("should have caught error")
          .catch -> done()

  context "#cleanupDist", ->
    beforeEach ->
      deploy.prepare()

    it "removes /dist", (done) ->
      ## we want to be sure statAsync throws
      ## because this should not be a directory
      deploy.cleanupDist().then ->
        fs.statAsync(distDir)
          .then -> done("should have caught error")
          .catch -> done()

  context "#cleanupBuild", ->
    beforeEach ->
      fs.ensureFileSync(buildDir + "/1.1.1/file.txt")

    it "removes /build", (done) ->
      ## we want to be sure statAsync throws
      ## because this should not be a directory
      deploy.cleanupBuild().then ->
        fs.statAsync(buildDir)
          .then -> done("should have caught error")
          .catch -> done()

  context "#updatePackages", ->
    beforeEach ->
      @setup = (obj = {}) =>
        @sandbox.stub(inquirer, "prompt").callsArgWith(1, obj)
        @sandbox.stub(deploy, "updateLocalPackageJson")

        deploy.prepare().then(deploy.updatePackages).then =>
          @pkg = fs.readJsonSync(distDir + "/package.json")

    it "is a valid json object", ->
      @setup().then =>
        expect(@pkg).to.be.an("Object")

    it "deletes bin", ->
      @setup().then =>
        expect(@pkg.bin).to.be.undefined

    it "deletes devDependencies", ->
      @setup().then =>
        expect(@pkg.devDependencies).to.be.undefined

    it "copies lib/secret_sauce when not in prod", ->
      @setup().then =>
        fs.statAsync(distDir + "/src/lib/secret_sauce.coffee")

    it "sets env to production", ->
      @setup().then =>
        expect(@pkg.env).to.eq "production"

    it "sets package version to answer object", ->
      @setup({publish: true, version: "1.2.3"}).then =>
        expect(@pkg.version).to.eq "1.2.3"

    it "calls #updateLocalPackageJson if answer publish is true", ->
      @setup({publish: true}).then ->
        expect(deploy.updateLocalPackageJson).to.be.calledOnce

    it "does not set version if publish is false", ->
      @setup({publish: false, version: "3.2.1"}).then =>
        expect(@pkg.version).not.to.eq "3.2.1"

  context "#updateLocalPackageJson", ->
    it "updates the local package.json with the new version", ->
      @sandbox.stub(fs, "writeJsonSync")
      @sandbox.spy deploy, "writeJsonSync"

      deploy.updateLocalPackageJson("4.5.6")

      args = deploy.writeJsonSync.getCall(0).args
      expect(args[0]).to.eq "./package.json"
      expect(args[1].version).to.eq "4.5.6"

  context "#getQuestions", ->
    it "bumps version", ->
      version = _.findWhere deploy.getQuestions("1.2.30"), {name: "version"}
      expect(version.default()).to.eq "1.2.31"

  # context "#runTests", ->
  #   beforeEach ->
  #     deploy.prepare()
  #       .then(deploy.updatePackages)
  #       .then(deploy.convertToJs)
  #       .then(deploy.obfuscate)
  #       # .then(deploy.cleanupSrc)

  #   it "runs mocha tests", ->
  #     deploy.runTests().then ->

  context "#build", ->
    beforeEach ->
      ## 10 min timeout
      @timeout(10 * 60 * 1000)

      deploy.version = "1.0.2"
      deploy.prepare().then(deploy.build)

    it "copies to build/{version}/", (done) ->
      fs.statAsync(buildDir + "/1.0.2/osx64")
        .then -> done()
        .catch(done)

    it "copies dist to app.nw", (done) ->
      fs.statAsync(buildDir + "/1.0.2/osx64/cypress.app/Contents/Resources/app.nw")
        .then -> done()
        .catch(done)

  context "#zipBuilds", ->
    beforeEach ->
      deploy.version = "1.1.1"
      fs.ensureFileSync(buildDir + "/1.1.1/osx64/file.txt")

    it "srcs the version'ed build directory", ->
      sync = @sandbox.spy glob, "sync"
      deploy.zipBuilds().then ->
        expect(sync).to.be.calledWith "#{buildDir}/1.1.1/osx64/**/*"

    it "creates 'cypress.zip'", (done) ->
      deploy.zipBuilds().then ->
        fs.statAsync(buildDir + "/1.1.1/osx64/cypress.zip")
          .then -> done()
          .catch(done)

  context "#deploy", ->
    fns = ["prepare", "updatePackages", "setVersion", "convertToJs", "obfuscate", "cleanupSrc", "build", "npmInstall", "cleanupDist", "zipBuilds", "uploadsToS3", "updateS3Manifest", "cleanupBuild"]

    beforeEach ->
      @sandbox.stub(inquirer, "prompt").callsArgWith(1, {})
      _.each fns, (fn) => @sandbox.stub(deploy, fn).resolves()
      return null

    _.each fns, (fn) =>
      it "calls #{fn}", ->
        deploy.deploy().then ->
          expect(deploy[fn]).to.be.called

    it "calls methods in the right order", ->
      deploy.deploy().then ->
        spies = _.map fns, (fn) -> deploy[fn]
        sinon.assert.callOrder.apply(sinon, spies)

  context "#npmInstall", ->
    beforeEach ->
      ## 10 min timeout
      @timeout(10 * 60 * 1000)

      deploy.version = "1.0.2"
      deploy.prepare().then(deploy.build)

    it "exec 'npm install'", ->
      deploy.npmInstall().then ->
        cmd = child_process.exec.getCall(0).args[0]
        opts = child_process.exec.getCall(0).args[1]
        expect(cmd).to.eq "npm install --production"
        expect(opts.cwd).to.include("/build/1.0.2/osx64/cypress.app/Contents/Resources/app.nw")

  context "#uploadToS3", ->
    beforeEach ->
      @currentTest.timeout(5000)
      deploy.version = "test-1.1.1"
      fs.ensureFileSync(buildDir + "/test-1.1.1/osx64/cypress.zip")
      deploy.getPublisher()
      @publish = @sandbox.spy(deploy.publisher, "publish")

    it "calls #getUploadDirName", ->
      @sandbox.spy(deploy, "getUploadDirName")
      deploy.publisherOptions = {simulate: true}
      deploy.uploadToS3("osx64").then ->
        expect(deploy.getUploadDirName).to.be.calledWith("test-1.1.1", "osx64")

    it "sets Cache-Control to 'no-cache'", ->
      deploy.publisherOptions = {simulate: true}
      deploy.uploadToS3().then =>
        expect(@publish.getCall(0).args[0]).to.deep.eq({
          "Cache-Control": "no-cache"
          "x-amz-acl": "public-read"
        })

    it "renames to include the version as dirname"

    it "srcs #{buildDir}/test-1.1.1/osx64/cypress.zip", ->
      deploy.publisherOptions = {simulate: true}
      src = @sandbox.spy gulp, "src"
      deploy.uploadToS3("osx64").then ->
        expect(src).to.be.calledWith "#{buildDir}/test-1.1.1/osx64/cypress.zip"

    it "publishes to s3", (done) ->
      deploy.uploadToS3().then ->
        params = {Bucket: "dist.cypress.io", Key: "test-1.1.1/cypress.zip"}
        deploy.publisher.client.headObject params, (err, data) ->
          done(err)

  context "#createRemoteManifest", ->
    beforeEach ->
      deploy.version = "5.6.7"
      deploy.getPublisher()
      deploy.publisherOptions = {simulate: true}
      @publish = @sandbox.spy(deploy.publisher, "publish")

    it "creates /builds/manifest.json", (done) ->
      deploy.createRemoteManifest().then ->
        fs.statAsync(buildDir + "/manifest.json")
          .then -> done()
          .catch(done)

    it "returns the src to manifest.json", ->
      deploy.createRemoteManifest().then (src) ->
        expect(src).to.eq "#{buildDir}/manifest.json"

    it "writes the correct JSON", ->
      deploy.createRemoteManifest().then (src) ->
        json = fs.readJsonSync(src)
        expect(json).to.deep.eq {
          name: "cypress"
          version: "5.6.7"
          packages: {
            mac:     {url: "https://s3.amazonaws.com/dist.cypress.io/5.6.7/osx64/cypress.zip"}
            win:     {url: "https://s3.amazonaws.com/dist.cypress.io/5.6.7/win64/cypress.zip"}
            linux64: {url: "https://s3.amazonaws.com/dist.cypress.io/5.6.7/linux64/cypress.zip"}
          }
        }

  context "#getUploadDirName", ->
    it "uses platform + version", ->
      d = deploy.getUploadDirName("3.2.3", "osx64")
      expect(d).to.eq "3.2.3/osx64/"

    it "uses override if truthy", ->
      d = deploy.getUploadDirName("3.2.3", "osx64", "fixture")
      expect(d).to.eq "fixture/"
