root          = "../../../"
path          = require "path"
expect        = require("chai").expect
deploy        = require("#{root}lib/deploy")()
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

describe.only "Deploy", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(child_process, "exec").callsArg(2)

  afterEach ->
    process.chdir(prevCwd)
    fs.removeSync(distDir)
    fs.removeSync(buildDir)

    @sandbox.restore()

  context "#prepare", ->
    beforeEach ->
      @prepare = deploy.prepare

    it "creates dist folder", ->
      @prepare().then ->
        isDir = fs.statSync(distDir).isDirectory()
        expect(isDir).to.be.true

    it "copies package.json to dist", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/package.json").isFile()).to.be.true

    it "copies config/app.yml to dist", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/config/app.yml").isFile()).to.be.true

    it "copies lib/cypress to dist src", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/cypress.coffee").isFile()).to.be.true

    it "copies lib/controllers to dist src", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/controllers").isDirectory()).to.be.true

    it "copies lib/util to dist src", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/util").isDirectory()).to.be.true

    it "copies lib/routes to dist src", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/routes").isDirectory()).to.be.true

    it "copies lib/cache to dist src", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/cache.coffee").isFile()).to.be.true

    it "copies lib/id_generator to dist src", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/id_generator.coffee").isFile()).to.be.true

    it "copies lib/keys to dist src", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/keys.coffee").isFile()).to.be.true

    it "copies lib/logger to dist src", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/logger.coffee").isFile()).to.be.true

    it "copies lib/project to dist src", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/project.coffee").isFile()).to.be.true

    it "copies lib/server to dist src", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/server.coffee").isFile()).to.be.true

    it "copies lib/socket to dist src", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/src/lib/socket.coffee").isFile()).to.be.true

    it "copies lib/public to dist", ->
      @prepare().then ->
        expect(fs.statSync(distDir + "/lib/public").isDirectory()).to.be.true

    it "copies nw/public to dist", ->
      @prepare().then ->
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

  context "#updatePackage", ->
    beforeEach ->
      @setup = (obj = {}) =>
        @sandbox.stub(inquirer, "prompt").callsArgWith(1, obj)

        deploy.prepare().then(deploy.updatePackage).then =>
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

    it "does not set version if publish is false", ->
      @setup({publish: false, version: "3.2.1"}).then =>
        expect(@pkg.version).not.to.eq "3.2.1"

  context "#getQuestions", ->
    it "bumps version", ->
      version = _.findWhere deploy.getQuestions("1.2.30"), {name: "version"}
      expect(version.default()).to.eq "1.2.31"

  # context "#runTests", ->
  #   beforeEach ->
  #     deploy.prepare()
  #       .then(deploy.updatePackage)
  #       .then(deploy.convertToJs)
  #       .then(deploy.obfuscate)
  #       # .then(deploy.cleanupSrc)

  #   it "runs mocha tests", ->
  #     deploy.runTests().then ->

  context "#package", ->
    beforeEach ->
      deploy.version = "1.0.2"
      deploy.prepare().then(deploy.package)

    it "copies to build/{version}/", (done) ->
      fs.statAsync(buildDir + "/1.0.2")
        .then -> done()
        .catch(done)

    it "copies dist to app.nw", (done) ->
      fs.statAsync(buildDir + "/1.0.2/cypress.app/Contents/Resources/app.nw")
        .then -> done()
        .catch(done)

  context "#zipPackage", ->
    beforeEach ->
      deploy.version = "1.1.1"
      fs.ensureFileSync(buildDir + "/1.1.1/file.txt")

    it "srcs the version'ed build directory", ->
      src = @sandbox.spy gulp, "src"
      deploy.zipPackage().then ->
        expect(src).to.be.calledWith "./build/1.1.1/**/*"

    it "creates 'cypress.zip'", (done) ->
      deploy.zipPackage().then ->
        fs.statAsync(buildDir + "/1.1.1/cypress.zip")
          .then -> done()
          .catch(done)

  context "#dist", ->
    fns = ["prepare", "updatePackage", "setVersion", "convertToJs", "obfuscate", "cleanupSrc", "npmInstall", "package", "cleanupDist", "zipPackage"]

    beforeEach ->
      @sandbox.stub(inquirer, "prompt").callsArgWith(1, {})
      _.each fns, (fn) => @sandbox.stub(deploy, fn).resolves()
      return null

    _.each fns, (fn) =>
      it "calls #{fn}", ->
        deploy.dist().then ->
          expect(deploy[fn]).to.be.called

    it "calls methods in the right order", ->
      deploy.dist().then ->
        spies = _.map fns, (fn) -> deploy[fn]
        sinon.assert.callOrder.apply(sinon, spies)

  context "#npmInstall", ->
    beforeEach ->
      deploy.prepare()

    it "exec 'npm install'", ->
      deploy.npmInstall().then ->
        cmd = child_process.exec.getCall(0).args[0]
        opts = child_process.exec.getCall(0).args[1]
        expect(cmd).to.eq "npm install --production"
        expect(opts).to.deep.eq {cwd: distDir}

  context "#uploadToS3", ->
    beforeEach ->
      @currentTest.timeout(5000)
      deploy.version = "test-1.1.1"
      fs.ensureFileSync(buildDir + "/test-1.1.1/cypress.zip")

    it "sets Cache-Control to 'no-cache'"

    it "renames to include the version as dirname"

    it "srcs ./build/test-1.1.1/cypress.zip", ->
      src = @sandbox.spy gulp, "src"
      deploy.uploadToS3().then ->
        expect(src).to.be.calledWith "./build/test-1.1.1/cypress.zip"

    it "publishes to s3"