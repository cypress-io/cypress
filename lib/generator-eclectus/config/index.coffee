_        = require 'underscore'
Eclectus = require '../eclectus'

class ConfigGenerator extends Eclectus.Base
  prompting: ->
    done = @async()

    ## if an eclectus.json file already exists, we should load that and
    ## replace the defaults
    question = [
      {
        name: "testFolder"
        message: "What's the folder which contains your JS tests?"
        default: "tests"
      },{
        name: "testFiles"
        message: "Which files should I scan for?"
        default: ".+(.js|.coffee)$"
      },{
        name: "ignoreFolders"
        message: "Which folders should I ignore?"
        default: "support"
      },{
        name: "ignoreFiles"
        message: "Which files should I ignore?"
        default: ""
      },{
        name: "rootFolder"
        message: "What is the root folder your assets should be served from? By default it is your root project directory."
        default: ""
      },{
        name: "baseUrl"
        message: "What is the url to the server hosting your app?"
        default: "http://localhost:3000/app"
      },{
        name: "exampleTestHtml"
        type: "confirm"
        message: "Should I create an example 'index.html' for you?"
        default: true
      },{
        name: "testFramework"
        type: "list",
        message: "Which test framework would you like to use?"
        choices: ["Mocha", "Jasmine", "QUnit", "Custom"]
        default: "Mocha"
      },{
        name: "sinon"
        type: "confirm"
        message: "Enable Sinon.js?"
        default: true
      },{
        name: "fixtures"
        type: "confirm"
        message: "Enable Fixtures?"
        default: true
      },{
        name: "port"
        message: "What port should I run the server on?"
        default: 3000
      }
    ]

    @prompt question, (answers) =>
      @exampleTestHtml = answers.exampleTestHtml

      @config.set
        stylesheets: []
        javascripts: []
        sourceFolder: []
        sourceFiles: []

      ## add the other configuration keys for stylesheets, utilities, etc
      ## add a message to the user that additional configuration options
      ## were written
      @config.set _(answers).omit("exampleTestHtml")
      @config.save()

      done()

  writing: ->
    ## bail if we're not supposed to create an example test html file
    return if not @exampleTestHtml

    @template "index.html", @config.get("defaultUrl")

module.exports = ConfigGenerator
