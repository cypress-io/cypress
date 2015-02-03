root          = "../../../"
path          = require "path"
expect        = require("chai").expect
deploy        = require "#{root}lib/deploy"
fs            = require "fs-extra"
gulp          = require "gulp"
sinon         = require "sinon"
sinonPromise  = require "sinon-as-promised"
child_process = require "child_process"

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

  it "creates dist folder", ->
    deploy().then ->
      isDir = fs.statSync(distDir).isDirectory()
      expect(isDir).to.be.true

  it "copies package.json to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/package.json").isFile()).to.be.true

  # it "copies bower.json to dist", ->
  #   deploy().then ->
  #     expect(fs.statSync(distDir + "/bower.json").isFile()).to.be.true

  it "copies bin/booter to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/bin/booter.coffee").isFile()).to.be.true

  it "copies config/app.yml to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/config/app.yml").isFile()).to.be.true

  it "copies lib/controllers to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/lib/controllers").isDirectory()).to.be.true

  it "copies lib/util to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/lib/util").isDirectory()).to.be.true

  it "copies lib/routes to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/lib/routes").isDirectory()).to.be.true

  it "copies lib/cache to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/lib/cache.coffee").isFile()).to.be.true

  it "copies lib/id_generator to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/lib/id_generator.coffee").isFile()).to.be.true

  it "copies lib/keys to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/lib/keys.coffee").isFile()).to.be.true

  it "copies lib/logger to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/lib/logger.coffee").isFile()).to.be.true

  it "copies lib/project to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/lib/project.coffee").isFile()).to.be.true

  it "copies lib/server to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/lib/server.coffee").isFile()).to.be.true

  it "copies lib/socket to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/lib/socket.coffee").isFile()).to.be.true

  it "copies lib/public to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/lib/public").isDirectory()).to.be.true

  it "copies nw/public to dist", ->
    deploy().then ->
      expect(fs.statSync(distDir + "/nw/public").isDirectory()).to.be.true

  context "npm install", ->
    it "exec 'npm install'", ->
      deploy().then ->
        cmd = child_process.exec.getCall(0).args[0]
        opts = child_process.exec.getCall(0).args[1]
        expect(cmd).to.eq "npm install --production"
        expect(opts).to.deep.eq {cwd: distDir}