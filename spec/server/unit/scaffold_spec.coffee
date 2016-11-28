require("../spec_helper")

path       = require("path")
glob       = require("glob")
Promise    = require("bluebird")
cypressEx  = require("@cypress/core-example")
config     = require("#{root}lib/config")
scaffold   = require("#{root}lib/scaffold")
Fixtures   = require("#{root}/spec/server/helpers/fixtures")

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

  context ".integration", ->
    beforeEach ->
      todosPath = Fixtures.projectPath("todos")

      config.get(todosPath).then (cfg) =>
        {@integrationFolder} = cfg

    it "creates both integrationFolder and example_spec.js when integrationFolder does not exist", ->
      ## todos has a integrations folder so let's first nuke it and then scaffold
      fs.removeAsync(@integrationFolder)
      .then =>
        scaffold.integration(@integrationFolder)
      .then =>
        Promise.all([
          fs.statAsync(@integrationFolder + "/example_spec.js").get("size")
          fs.statAsync(cypressEx.getPathToExample()).get("size")
        ]).spread (size1, size2) ->
          expect(size1).to.eq(size2)

    it "does not create example_spec.js if integrationFolder already exists", ->
      ## first remove it
      fs.removeAsync(@integrationFolder)
      .then =>
        ## create the integrationFolder ourselves manually
        fs.ensureDirAsync(@integrationFolder)
      .then =>
        ## now scaffold
        scaffold.integration(@integrationFolder)
      .then =>
        glob("**/*", {cwd: @integrationFolder})
      .then (files) ->
        ## ensure no files exist
        expect(files.length).to.eq(0)

  context ".support", ->
    beforeEach ->
      pristinePath = Fixtures.projectPath("pristine")

      config.get(pristinePath).then (@cfg) =>
        {@supportFolder} = @cfg

    it "does not create any files but index.js if supportFolder directory already exists", ->
      ## create the supportFolder ourselves manually
      fs.ensureDirAsync(@supportFolder)
      .then =>
        ## now scaffold
        scaffold.support(@supportFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @supportFolder})
      .then (files) ->
        expect(files.length).to.eq(1)
        expect(files[0]).to.include('index.js')

    it "does not create any files if supportFolder and index.js already exist", ->
      indexPath = path.join(@supportFolder, "index.js")
      ## create the supportFolder ourselves manually
      fs.ensureDirAsync(@supportFolder)
      .then =>
        ## now scaffold
        scaffold.support(@supportFolder, @cfg).then =>
          fs.outputFileAsync(indexPath, ";")
      .then =>
        glob("**/*", {cwd: @supportFolder})
      .then (files) ->
        fs.readFileAsync(indexPath).then (buffer) ->
          expect(files.length).to.eq(1)
          ## it doesn't change the contents of the existing index.js
          expect(buffer.toString()).to.equal(";")

    it "does not create any files if supportFile is not default", ->
      @cfg.resolved.supportFile.from = "config"

      scaffold.support(@supportFolder, @cfg)
      .then =>
        glob("**/*", {cwd: @supportFolder})
      .then (files) ->
        expect(files.length).to.eq(0)

    it "creates supportFolder and commands.js, defaults.js, and index.js when supportFolder does not exist", ->
      ## todos has a _support folder so let's first nuke it and then scaffold
      scaffold.support(@supportFolder, @cfg).then =>
        fs.readFileAsync(@supportFolder + "/commands.js", "utf8").then (str) =>
          expect(str).to.eq """
          // ***********************************************
          // This example commands.js shows you how to
          // create the custom command: 'login'.
          //
          // The commands.js file is a great place to
          // modify existing commands and create custom
          // commands for use throughout your tests.
          //
          // You can read more about custom commands here:
          // https://on.cypress.io/api/commands
          // ***********************************************
          //
          // Cypress.addParentCommand("login", function(email, password){
          //   var email    = email || "joe@example.com"
          //   var password = password || "foobar"
          //
          //   var log = Cypress.Log.command({
          //     name: "login",
          //     message: [email, password],
          //     consoleProps: function(){
          //       return {
          //         email: email,
          //         password: password
          //       }
          //     }
          //   })
          //
          //   cy
          //     .visit("/login", {log: false})
          //     .contains("Log In", {log: false})
          //     .get("#email", {log: false}).type(email, {log: false})
          //     .get("#password", {log: false}).type(password, {log: false})
          //     .get("button", {log: false}).click({log: false}) //this should submit the form
          //     .get("h1", {log: false}).contains("Dashboard", {log: false}) //we should be on the dashboard now
          //     .url({log: false}).should("match", /dashboard/, {log: false})
          //     .then(function(){
          //       log.snapshot().end()
          //     })
          // })
          """

          fs.readFileAsync(@supportFolder + "/defaults.js", "utf8").then (str) =>
            expect(str).to.eq """
            // ***********************************************
            // This example defaults.js shows you how to
            // customize the internal behavior of Cypress.
            //
            // The defaults.js file is a great place to
            // override defaults used throughout all tests.
            //
            // ***********************************************
            //
            // Cypress.Server.defaults({
            //   delay: 500,
            //   whitelist: function(xhr){}
            // })

            // Cypress.Cookies.defaults({
            //   whitelist: ["session_id", "remember_token"]
            // })
            """

            fs.readFileAsync(@supportFolder + "/index.js", "utf8").then (str) =>
              expect(str).to.eq """
              // ***********************************************************
              // This example support/index.js is processed and
              // loaded automatically before your other test files.
              //
              // This is a great place to put global configuration and
              // behavior that modifies Cypress.
              //
              // You can change the location of this file or turn off
              // automatically serving support files with the
              // 'supportFile' configuration option.
              //
              // You can read more here:
              // https://on.cypress.io/guides/configuration#section-global
              // ***********************************************************

              // Import commands.js and defaults.js
              // using ES2015 syntax:
              import "./commands"
              import "./defaults"

              // Alternatively you can use CommonJS syntax:
              // require("./commands")
              // require("./defaults")

              """

  context ".fixture", ->
    beforeEach ->
      todosPath = Fixtures.projectPath("todos")

      config.get(todosPath).then (cfg) =>
        {@fixturesFolder} = cfg

    it "creates both fixturesFolder and example.json when fixturesFolder does not exist", ->
      ## todos has a fixtures folder so let's first nuke it and then scaffold
      fs.removeAsync(@fixturesFolder)
      .then =>
        scaffold.fixture(@fixturesFolder)
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

    it "does not create example.json if fixturesFolder already exists", ->
      ## first remove it
      fs.removeAsync(@fixturesFolder)
      .then =>
        ## create the fixturesFolder ourselves manually
        fs.ensureDirAsync(@fixturesFolder)
      .then =>
        ## now scaffold
        scaffold.fixture(@fixturesFolder)
      .then =>
        glob("**/*", {cwd: @fixturesFolder})
      .then (files) ->
        ## ensure no files exist
        expect(files.length).to.eq(0)
