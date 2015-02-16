root          = "../../../"
path          = require "path"
expect        = require("chai").expect
Deploy        = require "#{root}lib/deploy"
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

describe "Deploy", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    @sandbox.stub(child_process, "exec").callsArg(2)

  afterEach ->
    process.chdir(prevCwd)
    fs.removeSync(distDir)

    @sandbox.restore()

  context "#prepare", ->
    beforeEach ->
      @prepare = Deploy.prepare

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
      Deploy.prepare()

    it "converts .coffee to .js", ->
      Deploy.convertToJs().then ->
        coffeeFiles = glob.sync(distDir + "/src/**/*.coffee")
        jsFiles     = glob.sync(distDir + "/src/**/*.js")

        expect(coffeeFiles.length).to.eq(jsFiles.length)
        expect(coffeeFiles.length).to.be.gt(0)
        expect(jsFiles.length).to.be.gt(0)

  context "#obfuscate", ->
    beforeEach ->
      Deploy.prepare().then(Deploy.convertToJs)

    it "writes obfuscated js to dist/lib/cypress.js", ->
      Deploy.obfuscate().then (obfuscated) ->
        cypress = fs.statSync(distDir + "/lib/cypress.js")
        expect(cypress.isFile()).to.be.true
        expect(obfuscated.length).to.be.gt(0)

  context "#cleanupSrc", ->
    beforeEach ->
      Deploy.prepare()

    it "removes /dist/src", (done) ->
      ## we want to be sure statAsync throws
      ## because this should not be a directory
      Deploy.cleanupSrc().then ->
        fs.statAsync(distDir + "/src")
          .then -> done("should have caught error")
          .catch -> done()

  context "#updatePackage", ->
    beforeEach ->
      @setup = (obj = {}) =>
        @sandbox.stub(inquirer, "prompt").callsArgWith(1, obj)

        Deploy.prepare().then(Deploy.updatePackage).then =>
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
      version = _.findWhere Deploy.getQuestions("1.2.30"), {name: "version"}
      expect(version.default()).to.eq "1.2.31"

  # context "#runTests", ->
  #   beforeEach ->
  #     Deploy.prepare()
  #       .then(Deploy.updatePackage)
  #       .then(Deploy.convertToJs)
  #       .then(Deploy.obfuscate)
  #       # .then(Deploy.cleanupSrc)

  #   it "runs mocha tests", ->
  #     Deploy.runTests().then ->

  context "#dist", ->
    beforeEach ->
      @sandbox.stub(inquirer, "prompt").callsArgWith(1, {})

    it "calls prepare", ->
      prepare = @sandbox.spy Deploy, "prepare"

      Deploy.dist().then ->
        expect(prepare).to.be.called

    it "calls updatePackage", ->
      updatePackage = @sandbox.spy Deploy, "updatePackage"

      Deploy.dist().then ->
        expect(updatePackage).to.be.called

    it "calls convertToJs", ->
      convertToJs = @sandbox.spy Deploy, "convertToJs"

      Deploy.dist().then ->
        expect(convertToJs).to.be.called

    it "calls obfuscate", ->
      obfuscate = @sandbox.spy Deploy, "obfuscate"

      Deploy.dist().then ->
        expect(obfuscate).to.be.called

    it "calls cleanupSrc", ->
      cleanupSrc = @sandbox.spy Deploy, "cleanupSrc"

      Deploy.dist().then ->
        expect(cleanupSrc).to.be.called

    it "calls npmInstall", ->
      npmInstall = @sandbox.spy Deploy, "npmInstall"

      Deploy.dist().then ->
        expect(npmInstall).to.be.called

  context "#npmInstall", ->
    beforeEach ->
      Deploy.prepare()

    it "exec 'npm install'", ->
      Deploy.npmInstall().then ->
        cmd = child_process.exec.getCall(0).args[0]
        opts = child_process.exec.getCall(0).args[1]
        expect(cmd).to.eq "npm install --production"
        expect(opts).to.deep.eq {cwd: distDir}