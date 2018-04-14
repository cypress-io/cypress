require("../spec_helper")

Promise        = require("bluebird")
human          = require("human-interval")
path           = require("path")
R              = require("ramda")

api            = require("#{root}lib/api")
config         = require("#{root}lib/config")
user           = require("#{root}lib/user")
files          = require("#{root}lib/files")
FixturesHelper = require("#{root}/test/support/helpers/fixtures")
filesController = require("#{root}lib/controllers/files")

describe "lib/controllers/files", ->
  beforeEach ->
    FixturesHelper.scaffold()

    @todosPath = FixturesHelper.projectPath("todos")

    config.get(@todosPath).then (cfg) =>
      @config = cfg

  afterEach ->
    FixturesHelper.remove()

  context "#getTestFiles", ->
    checkFoundSpec = (foundSpec) ->
      if not path.isAbsolute(foundSpec.absolute)
        throw new Error("path to found spec should be absolute #{JSON.stringify(foundSpec)}")

    it "returns absolute filenames", ->
      filesController
      .getTestFiles(@config)
      .then (R.prop("integration"))
      .then (R.forEach(checkFoundSpec))

    it "handles fixturesFolder being false", ->
      @config.fixturesFolder = false

      fn = => filesController.getTestFiles(@config)

      expect(fn).not.to.throw()

    it "by default, returns all files as long as they have a name and extension", ->
      config.get(FixturesHelper.projectPath("various-file-types"))
      .then (cfg) ->
        filesController.getTestFiles(cfg)
      .then (files) ->
        expect(files.integration.length).to.equal(3)
        expect(files.integration[0].name).to.equal("coffee_spec.coffee")
        expect(files.integration[1].name).to.equal("js_spec.js")
        expect(files.integration[2].name).to.equal("ts_spec.ts")

    it "returns files matching config.testFiles", ->
      config.get(FixturesHelper.projectPath("various-file-types"))
      .then (cfg) ->
        cfg.testFiles = "**/*.coffee"
        filesController.getTestFiles(cfg)
      .then (files) ->
        expect(files.integration.length).to.equal(1)
        expect(files.integration[0].name).to.equal("coffee_spec.coffee")

    it "filters using specPattern", ->
      config.get(FixturesHelper.projectPath("various-file-types"))
      .then (cfg) ->
        filesController.getTestFiles(cfg, [
          path.join(cfg.projectRoot, "cypress", "integration", "js_spec.js")
        ])
      .then (files) ->
        expect(files.integration.length).to.equal(1)
        expect(files.integration[0].name).to.equal("js_spec.js")

    it "filters using specPattern as array of glob patterns", ->
      config.get(FixturesHelper.projectPath("various-file-types"))
      .then (cfg) ->
        filesController.getTestFiles(cfg, [
          path.join(cfg.projectRoot, "cypress", "integration", "js_spec.js")
          path.join(cfg.projectRoot, "cypress", "integration", "ts*")
        ])
      .then (files) ->
        expect(files.integration.length).to.equal(2)
        expect(files.integration[0].name).to.equal("js_spec.js")
        expect(files.integration[1].name).to.equal("ts_spec.ts")

describe "lib/files", ->
  beforeEach ->
    FixturesHelper.scaffold()

    @todosPath = FixturesHelper.projectPath("todos")

    config.get(@todosPath).then (cfg) =>
      @config = cfg
      {@projectRoot} = cfg

  afterEach ->
    FixturesHelper.remove()

  context "#readFile", ->

    it "returns contents and full file path", ->
      files.readFile(@projectRoot, "tests/_fixtures/message.txt").then ({ contents, filePath }) ->
        expect(contents).to.eq "foobarbaz"
        expect(filePath).to.include "/.projects/todos/tests/_fixtures/message.txt"

    it "returns uses utf8 by default", ->
      files.readFile(@projectRoot, "tests/_fixtures/ascii.foo").then ({ contents }) ->
        expect(contents).to.eq "\n"

    it "uses encoding specified in options", ->
      files.readFile(@projectRoot, "tests/_fixtures/ascii.foo", {encoding: "ascii"}).then ({ contents }) ->
        expect(contents).to.eq "o#?\n"

    it "parses json to valid JS object", ->
      files.readFile(@projectRoot, "tests/_fixtures/users.json").then ({ contents }) ->
        expect(contents).to.eql [
          {
            id: 1
            name: "brian"
          },{
            id: 2
            name: "jennifer"
          }
        ]

  context "#writeFile", ->

    it "writes the file's contents and returns contents and full file path", ->
      files.writeFile(@projectRoot, ".projects/write_file.txt", "foo").then =>
        files.readFile(@projectRoot, ".projects/write_file.txt").then ({ contents, filePath }) ->
          expect(contents).to.equal("foo")
          expect(filePath).to.include("/.projects/todos/.projects/write_file.txt")

    it "uses encoding specified in options", ->
      files.writeFile(@projectRoot, ".projects/write_file.txt", "", {encoding: "ascii"}).then =>
        files.readFile(@projectRoot, ".projects/write_file.txt").then ({ contents }) ->
          expect(contents).to.equal("�")

    it "overwrites existing file without issue", ->
      files.writeFile(@projectRoot, ".projects/write_file.txt", "foo").then =>
        files.readFile(@projectRoot, ".projects/write_file.txt").then ({ contents }) =>
          expect(contents).to.equal("foo")
          files.writeFile(@projectRoot, ".projects/write_file.txt", "bar").then =>
            files.readFile(@projectRoot, ".projects/write_file.txt").then ({ contents }) ->
              expect(contents).to.equal("bar")
