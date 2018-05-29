require("../spec_helper")

path       = require("path")
Promise    = require("bluebird")
cypressEx  = require("@packages/example")
snapshot   = require("snap-shot-it")
config     = require("#{root}lib/config")
Project    = require("#{root}lib/project")
scaffold   = require("#{root}lib/scaffold")
fs         = require("#{root}lib/util/fs")
glob       = require("#{root}lib/util/glob")
Fixtures   = require("#{root}/test/support/helpers/fixtures")

describe "lib/scaffold", ->
  beforeEach ->
    Fixtures.scaffold()

  afterEach ->
    Fixtures.remove()

  context ".integrationExampleName", ->
    it "returns examples", ->
      expect(scaffold.integrationExampleName()).to.eq("examples")

  context.skip ".isNewProject", ->
    beforeEach ->
      todosPath = Fixtures.projectPath("todos")

      config.get(todosPath)
      .then (@cfg) =>
        {@integrationFolder} = @cfg

    it "is false when files.length isnt 1", ->
      id = =>
        @ids = Project(@idsPath)
        @ids.getConfig()
        .then (cfg) =>
          @ids.scaffold(cfg).return(cfg)
        .then (cfg) =>
          @ids.determineIsNewProject(cfg.integrationFolder)
        .then (ret) ->
          expect(ret).to.be.false

      todo = =>
        @todos = Project(@todosPath)
        @todos.getConfig()
        .then (cfg) =>
          @todos.scaffold(cfg).return(cfg)
        .then (cfg) =>
          @todos.determineIsNewProject(cfg.integrationFolder)
        .then (ret) ->
          expect(ret).to.be.false

      Promise.join(id, todo)

    it "is true when files, name + bytes match to scaffold", ->
      ## TODO this test really can move to scaffold
      pristine = Project(@pristinePath)
      pristine.getConfig()
      .then (cfg) ->
        pristine.scaffold(cfg).return(cfg)
      .then (cfg) ->
        pristine.determineIsNewProject(cfg.integrationFolder)
      .then (ret) ->
        expect(ret).to.be.true

    it "is false when bytes dont match scaffold", ->
      ## TODO this test really can move to scaffold
      pristine = Project(@pristinePath)
      pristine.getConfig()
      .then (cfg) ->
        pristine.scaffold(cfg).return(cfg)
      .then (cfg) ->
        example = scaffold.integrationExampleName()
        file    = path.join(cfg.integrationFolder, example)

        ## write some data to the file so it is now
        ## different in file size
        fs.readFileAsync(file, "utf8")
        .then (str) ->
          str += "foo bar baz"
          fs.writeFileAsync(file, str).return(cfg)
      .then (cfg) ->
        pristine.determineIsNewProject(cfg.integrationFolder)
      .then (ret) ->
        expect(ret).to.be.false

  context ".integration", ->
    beforeEach ->
      pristinePath = Fixtures.projectPath("pristine")

      config.get(pristinePath).then (@cfg) =>
        {@integrationFolder} = @cfg

    it "creates both integrationFolder and example specs when integrationFolder does not exist", ->
      Promise.join(
        cypressEx.getPathToExamples(),
        scaffold.integration(@integrationFolder, @cfg)
      )
      .spread (exampleSpecs) =>
        Promise.join(
          fs.statAsync(@integrationFolder + "/examples/actions.spec.js").get("size"),
          fs.statAsync(exampleSpecs[0]).get("size"),
          fs.statAsync(@integrationFolder + "/examples/location.spec.js").get("size"),
          fs.statAsync(exampleSpecs[8]).get("size")
        ).spread (size1, size2, size3, size4) ->
          expect(size1).to.eq(size2)
          expect(size3).to.eq(size4)

    it "does not create any files if integrationFolder is not default", ->
      @cfg.resolved.integrationFolder.from = "config"

      scaffold.integration(@integrationFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @integrationFolder})
      .then (files) ->
        expect(files.length).to.eq(0)

    it "does not create example specs if integrationFolder already exists", ->
      ## create the integrationFolder ourselves manually
      fs.ensureDirAsync(@integrationFolder)
      .then =>
        ## now scaffold
        scaffold.integration(@integrationFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @integrationFolder})
      .then (files) ->
        ## ensure no files exist
        expect(files.length).to.eq(0)

    it "throws if trying to scaffold a file not present in file tree", ->
      integrationPath = path.join(@integrationFolder, "foo")
      fs.removeAsync(integrationPath)
      .then =>
        scaffold.integration(integrationPath, @cfg)
      .then ->
        throw new Error("Should throw the right error")
      .catch (err = {}) =>
        expect(err.stack).to.contain("not in the scaffolded file tree")

  context ".support", ->
    beforeEach ->
      pristinePath = Fixtures.projectPath("pristine")

      config.get(pristinePath).then (@cfg) =>
        {@supportFolder} = @cfg

    it "does not create any files if supportFolder directory already exists", ->
      ## first remove it
      fs.removeAsync(@supportFolder)
      .then =>
        ## create the supportFolder ourselves manually
        fs.ensureDirAsync(@supportFolder)
      .then =>
        ## now scaffold
        scaffold.support(@supportFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @supportFolder})
      .then (files) ->
        ## ensure no files exist
        expect(files.length).to.eq(0)

    it "does not create any files if supportFile is not default", ->
      @cfg.resolved.supportFile.from = "config"

      scaffold.support(@supportFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @supportFolder})
      .then (files) ->
        expect(files.length).to.eq(0)

    it "does not create any files if supportFile is false", ->
      @cfg.supportFile = false

      scaffold.support(@supportFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @supportFolder})
      .then (files) ->
        expect(files.length).to.eq(0)

    it "throws if trying to scaffold a file not present in file tree", ->
      supportPath = path.join(@supportFolder, "foo")
      fs.removeAsync(supportPath)
      .then =>
        scaffold.support(supportPath, @cfg)
      .then ->
        throw new Error("Should throw the right error")
      .catch (err = {}) =>
        expect(err.stack).to.contain("not in the scaffolded file tree")

    it "creates supportFolder and commands.js and index.js when supportFolder does not exist", ->
      scaffold.support(@supportFolder, @cfg)
      .then =>
        Promise.join(
          fs.readFileAsync(@supportFolder + "/commands.js", "utf8")
          fs.readFileAsync(@supportFolder + "/index.js", "utf8")
        ).spread (commandsContents, indexContents) ->
          snapshot(commandsContents)
          snapshot(indexContents)

  context ".plugins", ->
    beforeEach ->
      pristinePath = Fixtures.projectPath("pristine")

      config.get(pristinePath).then (@cfg) =>
        {@pluginsFile} = @cfg
        @pluginsFolder = path.dirname(@pluginsFile)

    it "creates pluginsFile when pluginsFolder does not exist", ->
      ## first remove it
      fs.removeAsync(@pluginsFolder)
      .then =>
        scaffold.plugins(@pluginsFolder, @cfg)
      .then =>
        fs.readFileAsync(@pluginsFolder + "/index.js", "utf8")
      .then (str) ->
        snapshot(str.split('`').join('<backtick>'))

    it "does not create any files if pluginsFile directory already exists", ->
      ## first remove it
      fs.removeAsync(@pluginsFolder)
      .then =>
        ## create the pluginsFolder ourselves manually
        fs.ensureDirAsync(@pluginsFolder)
      .then =>
        ## now scaffold
        scaffold.plugins(@pluginsFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @pluginsFolder})
      .then (files) ->
        ## ensure no files exist
        expect(files.length).to.eq(0)

    it "does not create any files if pluginsFile is not default", ->
      @cfg.resolved.pluginsFile.from = "config"

    it "does not create any files if pluginsFile is false", ->
      @cfg.pluginsFile = false

      scaffold.plugins(@pluginsFile, @cfg)
      .then =>
        glob("**/*", {cwd: @pluginsFile})
      .then (files) ->
        expect(files.length).to.eq(0)

  context ".fixture", ->
    beforeEach ->
      pristinePath = Fixtures.projectPath("pristine")

      config.get(pristinePath).then (@cfg) =>
        {@fixturesFolder} = @cfg

    it "creates both fixturesFolder and example.json when fixturesFolder does not exist", ->
      scaffold.fixture(@fixturesFolder, @cfg)
      .then =>
        fs.readFileAsync(@fixturesFolder + "/example.json", "utf8")
      .then (str) ->
        expect(str).to.eq """
        {
          "name": "Using fixtures to represent data",
          "email": "hello@cypress.io",
          "body": "Fixtures are a great way to mock data for responses to routes"
        }
        """

    it "does not create any files if fixturesFolder is not default", ->
      @cfg.resolved.fixturesFolder.from = "config"

      scaffold.fixture(@fixturesFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @fixturesFolder})
      .then (files) ->
        expect(files.length).to.eq(0)

    it "does not create any files if fixturesFolder is false", ->
      @cfg.fixturesFolder = false

      scaffold.fixture(@fixturesFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @fixturesFolder})
      .then (files) ->
        expect(files.length).to.eq(0)

    it "does not create example.json if fixturesFolder already exists", ->
      ## create the fixturesFolder ourselves manually
      fs.ensureDirAsync(@fixturesFolder)
      .then =>
        ## now scaffold
        scaffold.fixture(@fixturesFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @fixturesFolder})
      .then (files) ->
        ## ensure no files exist
        expect(files.length).to.eq(0)

    it "throws if trying to scaffold a file not present in file tree", ->
      fixturesPath = path.join(@fixturesFolder, "foo")
      fs.removeAsync(fixturesPath)
      .then =>
        scaffold.fixture(fixturesPath, @cfg)
      .then ->
        throw new Error("Should throw the right error")
      .catch (err = {}) =>
        expect(err.stack).to.contain("not in the scaffolded file tree")

  context ".fileTree", ->
    beforeEach ->
      todosPath = Fixtures.projectPath("todos")
      config.get(todosPath).then (@cfg) =>
        @cfg.pluginsFile = path.join(@cfg.projectRoot, "cypress/plugins/index.js")

    it "returns tree-like structure of scaffolded", ->
      snapshot(scaffold.fileTree(@cfg))

    it "leaves out fixtures if configured to false", ->
      @cfg.fixturesFolder = false
      snapshot(scaffold.fileTree(@cfg))

    it "leaves out support if configured to false", ->
      @cfg.supportFile = false
      snapshot(scaffold.fileTree(@cfg))

    it "leaves out plugins if configured to false", ->
      @cfg.pluginsFile = false
      snapshot(scaffold.fileTree(@cfg))
