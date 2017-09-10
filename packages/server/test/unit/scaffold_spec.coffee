require("../spec_helper")

path       = require("path")
glob       = require("glob")
Promise    = require("bluebird")
cypressEx  = require("@packages/example")
config     = require("#{root}lib/config")
Project    = require("#{root}lib/project")
scaffold   = require("#{root}lib/scaffold")
Fixtures   = require("#{root}/test/support/helpers/fixtures")

glob = Promise.promisify(glob)

supportFolder = "cypress/support"

describe "lib/scaffold", ->
  beforeEach ->
    Fixtures.scaffold()

  afterEach ->
    Fixtures.remove()

  context ".integrationExampleName", ->
    it "returns example_spec.js", ->
      expect(scaffold.integrationExampleName()).to.eq("example_spec.js")

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

    it "creates both integrationFolder and example_spec.js when integrationFolder does not exist", ->
      scaffold.integration(@integrationFolder, @cfg)
      .then =>
        Promise.all([
          fs.statAsync(@integrationFolder + "/example_spec.js").get("size")
          fs.statAsync(cypressEx.getPathToExample()).get("size")
        ]).spread (size1, size2) ->
          expect(size1).to.eq(size2)

    it "does not create any files if integrationFolder is not default", ->
      @cfg.resolved.integrationFolder.from = "config"

      scaffold.integration(@integrationFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @integrationFolder})
      .then (files) ->
        expect(files.length).to.eq(0)

    it "does not create example_spec.js if integrationFolder already exists", ->
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

    it "creates supportFolder and commands.js, and index.js when supportFolder does not exist", ->
      ## todos has a _support folder so let's first nuke it and then scaffold
      scaffold.support(@supportFolder, @cfg)
      .then =>
        fs.readFileAsync(@supportFolder + "/commands.js", "utf8")
        .then (str) =>
          expect(str).to.eq """
          // ***********************************************
          // This example commands.js shows you how to
          // create various custom commands and overwrite
          // existing commands.
          //
          // For more comprehensive examples of custom
          // commands please read more here:
          // https://on.cypress.io/custom-commands
          // ***********************************************
          //
          //
          // -- This is a parent command --
          // Cypress.Commands.add("login", (email, password) => { ... })
          //
          //
          // -- This is a child command --
          // Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
          //
          //
          // -- This is a dual command --
          // Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
          //
          //
          // -- This is will overwrite an existing command --
          // Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

          """

          fs.readFileAsync(@supportFolder + "/index.js", "utf8").then (str) =>
            expect(str).to.eq """
            // ***********************************************************
            // This example support/index.js is processed and
            // loaded automatically before your test files.
            //
            // This is a great place to put global configuration and
            // behavior that modifies Cypress.
            //
            // You can change the location of this file or turn off
            // automatically serving support files with the
            // 'supportFile' configuration option.
            //
            // You can read more here:
            // https://on.cypress.io/configuration
            // ***********************************************************

            // Import commands.js using ES2015 syntax:
            import "./commands"

            // Alternatively you can use CommonJS syntax:
            // require("./commands")

            """

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

    it "returns tree-like structure of scaffolded", ->
      expect(scaffold.fileTree(@cfg)).eql([
        {
          name: "tests"
          children: [
            {
              name: "example_spec.js"
            },{
              name: "_fixtures"
              children: [
                { name: "example.json" }
              ]
            },{
              name: "_support"
              children: [
                { name: "commands.js" }
                { name: "index.js" }
              ]
            }
          ]
        }
      ])

    it "leaves out fixtures if configured to false", ->
      @cfg.fixturesFolder = false
      expect(scaffold.fileTree(@cfg)).eql([
        {
          name: "tests"
          children: [
            {
              name: "example_spec.js"
            },{
              name: "_support"
              children: [
                { name: "commands.js" }
                { name: "index.js" }
              ]
            }
          ]
        }
      ])

    it "leaves out support if configured to false", ->
      @cfg.supportFile = false
      expect(scaffold.fileTree(@cfg)).eql([
        {
          name: "tests"
          children: [
            {
              name: "example_spec.js"
            },{
              name: "_fixtures"
              children: [
                { name: "example.json" }
              ]
            }
          ]
        }
      ])
