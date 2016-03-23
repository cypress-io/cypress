require("../spec_helper")

path        = require("path")
glob        = require("glob")
config      = require("#{root}lib/config")
support     = require("#{root}lib/support")
Fixtures    = require("#{root}/spec/server/helpers/fixtures")

glob = Promise.promisify(glob)

describe "lib/support", ->
  beforeEach ->
    Fixtures.scaffold()

    pristinePath = Fixtures.projectPath("pristine")

    config.get(pristinePath).then (cfg) =>
      {@supportFolder} = cfg

  afterEach ->
    Fixtures.remove()

  context ".scaffold", ->
    beforeEach ->
      fs.removeAsync(@supportFolder)

    it "is noop when removal is true and there is no folder", ->
      support.scaffold(@supportFolder, {remove: true})
      .then =>
        fs.statAsync(@supportFolder)
        .then ->
          throw new Error("should have failed but didnt")
        .catch ->

    it "removes supportFolder + contents when existing", ->
      support.scaffold(@supportFolder)
      .then =>
        support.scaffold(@supportFolder, {remove: true})
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
        support.scaffold(@supportFolder)
      .then =>
        glob("**/*", {cwd: @supportFolder})
      .then (files) ->
        ## ensure no files exist
        expect(files.length).to.eq(0)

    it "creates both supportFolder and commands.js and defaults.js when supportFolder does not exist", ->
      ## todos has a _support folder so let's first nuke it and then scaffold
      support.scaffold(@supportFolder).then =>
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

