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

      @config = {
        resolved: { supportScripts: { from: "default" } }
        supportScripts: "support/index.js"
      }

      @resolvedSupportFolder = path.resolve(pristinePath, supportFolder)

    it "removes supportFolder + contents when existing", ->
      scaffold.support(@resolvedSupportFolder, null, @config)
      .then =>
        scaffold.support(@resolvedSupportFolder, {remove: true}, @config)
      .then =>
        fs.statAsync(@resolvedSupportFolder)
        .then ->
          throw new Error("should have failed but didnt")
        .catch ->

    it "does not create any files but index.js if supportFolder already exists", ->
      ## create the supportFolder ourselves manually
      fs.ensureDirAsync(@resolvedSupportFolder)
      .then =>
        ## now scaffold
        scaffold.support(@resolvedSupportFolder, null, @config)
      .then =>
        glob("**/*", {cwd: @resolvedSupportFolder})
      .then (files) ->
        expect(files.length).to.eq(1)
        expect(files[0]).to.include('index.js')

    it "does not create any files if supportFolder and index.js already exist", ->
      indexPath = path.join(@resolvedSupportFolder, "index.js")
      ## create the supportFolder ourselves manually
      fs.ensureDirAsync(@resolvedSupportFolder)
      .then =>
        ## now scaffold
        scaffold.support(@resolvedSupportFolder, null, @config).then =>
          fs.outputFileAsync(indexPath, ";")
      .then =>
        glob("**/*", {cwd: @resolvedSupportFolder})
      .then (files) ->
        fs.readFileAsync(indexPath).then (buffer) ->
          expect(files.length).to.eq(1)
          ## it doesn't change the contents of the existing index.js
          expect(buffer.toString()).to.equal(";")

    it "does not create any files if supportScripts is false", ->
      @config.supportScripts = false
      scaffold.support(@resolvedSupportFolder, null, @config)
      .then =>
        glob("**/*", {cwd: @resolvedSupportFolder})
      .then (files) ->
        expect(files.length).to.eq(0)

    it "does not create supportFolder/index.js if supportScripts is not default", ->
      @config.resolved.supportScripts.from = "config"
      fs.ensureDirAsync(@resolvedSupportFolder)
      .then =>
        scaffold.support(@resolvedSupportFolder, null, @config)
      .then =>
        glob("**/*", {cwd: @resolvedSupportFolder})
      .then (files) ->
        expect(files.length).to.eq(0)

    it "creates both supportFolder and commands.js, defaults.js, and index.js when supportFolder does not exist", ->
      ## todos has a _support folder so let's first nuke it and then scaffold
      scaffold.support(@resolvedSupportFolder, null, @config).then =>
        fs.readFileAsync(@resolvedSupportFolder + "/commands.js", "utf8").then (str) =>
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

          fs.readFileAsync(@resolvedSupportFolder + "/defaults.js", "utf8").then (str) =>
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

            fs.readFileAsync(@resolvedSupportFolder + "/index.js", "utf8").then (str) =>
              expect(str).to.eq """
              // ***********************************************
              // This example support/index.js is loaded before
              // any other test files
              //
              // You can change the location of this file with
              // the 'supportScripts' configuration option
              //
              // You can read more here:
              // https://on.cypress.io/guides/configuration#section-global
              // ***********************************************

              // import the commands.js file and the defaults.js file
              import "./commands"
              import "./defaults"

              // You can alternatively use CommonJS:
              // require("./commands")
              // require("./defaults")

              """

  context ".fixture", ->
    beforeEach ->
      todosPath = Fixtures.projectPath("todos")

      config.get(todosPath).then (cfg) =>
        {@fixturesFolder} = cfg

    it "is noop when removal is true and there is no folder", ->
      scaffold.fixture(@fixturesFolder, {remove: true})
      .then =>
        fs.statAsync(@fixturesFolder)
        .then ->
          throw new Error("should have failed but didnt")
        .catch ->

    it "removes fixturesFolder + contents when existing", ->
      scaffold.fixture(@fixturesFolder)
      .then =>
        scaffold.fixture(@fixturesFolder, {remove: true})
      .then =>
        fs.statAsync(@fixturesFolder)
        .then ->
          throw new Error("should have failed but didnt")
        .catch ->

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
