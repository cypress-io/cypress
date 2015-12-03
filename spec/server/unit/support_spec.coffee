root        = '../../../'
path        = require 'path'
fs          = require 'fs-extra'
chai        = require 'chai'
Server      = require "#{root}lib/server"
Support     = require "#{root}lib/support"
Fixtures    = require "#{root}/spec/server/helpers/fixtures"

expect       = chai.expect

describe "Support ", ->
  beforeEach ->
    Fixtures.scaffold()

    @todos = Fixtures.project("todos")

    @server  = Server(@todos)
    @app     = @server.app
    @support = Support(@app)

  afterEach ->
    Fixtures.remove()

  context "#constructor", ->
    it "sets folder to supportFolder", ->
      expect(@support.folder).to.eq @todos + "/tests/_support"

  context "#scaffold", ->
    it "creates both supportFolder and spec_helper.js when supportFolder does not exist", ->
      ## todos has a _support folder so let's first nuke it and then scaffold
      fs.removeAsync(@support.folder).then =>
        @support.scaffold().then =>
          fs.readFileAsync(@support.folder + "/spec_helper.js", "utf8").then (str) ->
            expect(str).to.eq """
            // ***********************************************
            // This example spec_helper.js shows you how to
            // create the custom command: 'login'.
            //
            // The spec_helper.js file is a great place to
            // add reusable logic / custom commands which
            // become usable in every single test file.
            //
            // You can read more about custom commands here:
            // http://on.cypress.io/commands#customizing
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

    it "does not create spec_helper.js if supportFolder already exists", (done) ->
      fs.removeAsync(@support.folder).then =>
        ## create the supportFolder ourselves manually
        fs.ensureDirAsync(@support.folder).then =>
          ## now scaffold
          @support.scaffold().then =>
            ## ensure spec_helper.js doesnt exist
            fs.statAsync(path.join(@support.folder, "spec_helper.js"))
              .catch -> done()