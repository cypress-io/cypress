require("../spec_helper")

R = require("ramda")
path = require("path")
files = require("#{root}lib/files")
config = require("#{root}lib/config")
specsUtil = require("#{root}lib/util/specs")
FixturesHelper = require("#{root}/test/support/helpers/fixtures")
debug = require("debug")("test")

describe "lib/util/specs", ->
  beforeEach ->
    FixturesHelper.scaffold()

    @todosPath = FixturesHelper.projectPath("todos")

    config.get(@todosPath)
    .then (cfg) =>
      @config = cfg

  afterEach ->
    FixturesHelper.remove()

  context ".find", ->
    checkFoundSpec = (foundSpec) ->
      if not path.isAbsolute(foundSpec.absolute)
        throw new Error("path to found spec should be absolute #{JSON.stringify(foundSpec)}")

    it "returns absolute filenames", ->
      specsUtil
      .find(@config)
      .then (R.forEach(checkFoundSpec))

    it "handles fixturesFolder being false", ->
      @config.fixturesFolder = false

      fn = => specsUtil.find(@config)

      expect(fn).not.to.throw()

    it "by default, returns all files as long as they have a name and extension", ->
      config.get(FixturesHelper.projectPath("various-file-types"))
      .then (cfg) ->
        specsUtil.find(cfg)
      .then (files) ->
        expect(files.length).to.equal(3)
        expect(files[0].name).to.equal("coffee_spec.coffee")
        expect(files[1].name).to.equal("js_spec.js")
        expect(files[2].name).to.equal("ts_spec.ts")

    it "returns files matching config.testFiles", ->
      config.get(FixturesHelper.projectPath("various-file-types"))
      .then (cfg) ->
        cfg.testFiles = "**/*.coffee"
        specsUtil.find(cfg)
      .then (files) ->
        expect(files.length).to.equal(1)
        expect(files[0].name).to.equal("coffee_spec.coffee")

    it "uses glob to process config.testFiles", ->
      config.get(FixturesHelper.projectPath("various-file-types"))
      .then (cfg) ->
        cfg.testFiles = "{coffee_*.coffee,js_spec.js}"
        specsUtil.find(cfg)
      .then (files) ->
        debug("found spec files %o", files)
        expect(files.length).to.equal(2)
        expect(files[0].name).to.equal("coffee_spec.coffee")
        expect(files[1].name).to.equal("js_spec.js")

    it "allows array in config.testFiles", ->
      config.get(FixturesHelper.projectPath("various-file-types"))
      .then (cfg) ->
        cfg.testFiles = ["coffee_*.coffee", "js_spec.js"]
        specsUtil.find(cfg)
      .then (files) ->
        debug("found spec files %o", files)
        expect(files.length).to.equal(2)
        expect(files[0].name).to.equal("coffee_spec.coffee")
        expect(files[1].name).to.equal("js_spec.js")

    it "filters using specPattern", ->
      config.get(FixturesHelper.projectPath("various-file-types"))
      .then (cfg) ->
        specPattern = [
          path.join(cfg.projectRoot, "cypress", "integration", "js_spec.js")
        ]
        specsUtil.find(cfg, specPattern)
      .then (files) ->
        expect(files.length).to.equal(1)
        expect(files[0].name).to.equal("js_spec.js")

    it "filters using specPattern as array of glob patterns", ->
      config.get(FixturesHelper.projectPath("various-file-types"))
      .then (cfg) ->
        debug("test config testFiles is %o", cfg.testFiles)
        specPattern = [
          path.join(cfg.projectRoot, "cypress", "integration", "js_spec.js")
          path.join(cfg.projectRoot, "cypress", "integration", "ts*")
        ]
        specsUtil.find(cfg, specPattern)
      .then (files) ->
        expect(files.length).to.equal(2)
        expect(files[0].name).to.equal("js_spec.js")
        expect(files[1].name).to.equal("ts_spec.ts")

    it "properly handles directories with names including '.'", ->
      config.get(FixturesHelper.projectPath("odd-directory-name"))
      .then (cfg) ->
        specsUtil.find(cfg)
      .then (files) ->
        expect(files.length).to.equal(1)
        expect(files[0].name).to.equal("1.0/sample_spec.js")
