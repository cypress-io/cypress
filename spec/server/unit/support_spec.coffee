require("../spec_helper")

path        = require("path")
config      = require("#{root}lib/config")
support     = require("#{root}lib/support")
Fixtures    = require("#{root}/spec/server/helpers/fixtures")

describe "lib/support", ->
  beforeEach ->
    Fixtures.scaffold()

    @todosPath = Fixtures.projectPath("todos")

    config.get(@todosPath).then (cfg) =>
      @cfg    = cfg
      @folder = path.join(cfg.projectRoot, cfg.supportFolder)

  afterEach ->
    Fixtures.remove()

  context "#scaffold", ->
    it "creates both supportFolder and commands.js and defaults.js when supportFolder does not exist", ->
      ## todos has a _support folder so let's first nuke it and then scaffold
      fs.removeAsync(@folder).then =>
        support.scaffold(@cfg.projectRoot, @cfg.supportFolder).then =>
          fs.readFileAsync(@folder + "/commands.js", "utf8").then (str) =>
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

            fs.readFileAsync(@folder + "/defaults.js", "utf8").then (str) ->
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

    it "does not create spec_helper.js if supportFolder already exists", (done) ->
      fs.removeAsync(@folder).then =>
        ## create the supportFolder ourselves manually
        fs.ensureDirAsync(@folder).then =>
          ## now scaffold
          support.scaffold(@cfg.projectRoot, @cfg.supportFolder).then =>
            ## ensure spec_helper.js doesnt exist
            fs.statAsync(path.join(@folder, "spec_helper.js"))
              .catch -> done()
