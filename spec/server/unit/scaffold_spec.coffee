require("../spec_helper")

path       = require("path")
glob       = require("glob")
config     = require("#{root}lib/config")
scaffold   = require("#{root}lib/scaffold")
Fixtures   = require("#{root}/spec/server/helpers/fixtures")

glob = Promise.promisify(glob)

describe "lib/scaffold", ->
  beforeEach ->
    Fixtures.scaffold()

  afterEach ->
    Fixtures.remove()

  context ".support", ->
    beforeEach ->
      pristinePath = Fixtures.projectPath("pristine")

      config.get(pristinePath).then (cfg) =>
        {@supportFolder} = cfg

    it "is noop when removal is true and there is no folder", ->
      scaffold.support(@supportFolder, {remove: true})
      .then =>
        fs.statAsync(@supportFolder)
        .then ->
          throw new Error("should have failed but didnt")
        .catch ->

    it "removes supportFolder + contents when existing", ->
      scaffold.support(@supportFolder)
      .then =>
        scaffold.support(@supportFolder, {remove: true})
      .then =>
        fs.statAsync(@supportFolder)
        .then ->
          throw new Error("should have failed but didnt")
        .catch ->

    it "does not create any files if supportFolder already exists", ->
      ## create the supportFolder ourselves manually
      fs.ensureDirAsync(@supportFolder)
      .then =>
        ## now scaffold
        scaffold.support(@supportFolder)
      .then =>
        glob("**/*", {cwd: @supportFolder})
      .then (files) ->
        ## ensure no files exist
        expect(files.length).to.eq(0)

    it "creates both supportFolder and commands.js and defaults.js when supportFolder does not exist", ->
      ## todos has a _support folder so let's first nuke it and then scaffold
      scaffold.support(@supportFolder).then =>
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
          //     onConsole: function(){
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

          fs.readFileAsync(@supportFolder + "/defaults.js", "utf8").then (str) ->
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
          "example": "fixture"
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
