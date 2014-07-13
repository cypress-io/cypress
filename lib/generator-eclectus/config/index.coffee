_        = require("underscore")
Eclectus = require("../eclectus")

class ConfigGenerator extends Eclectus.Base
  prompting: ->
    done = @async()

    ## if an eclectus.json file already exists, we should load that and
    ## replace the defaults
    question = [
      {
        name: "testPath"
        message: "What's the path to your JS tests?"
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
        name: "testHtml"
        message: "What's the path to your .html file?"
        default: "tests/support/index.html"
      },{
        name: "exampleTestHtml"
        type: "confirm"
        message: "Should I create an example 'index.html' for you?"
        default: true
      }
    ]

    @prompt question, (answers) =>
      @exampleTestHtml = answers.exampleTestHtml

      @config.set _(answers).omit("exampleTestHtml")
      @config.save()

      done()

  writing: ->
    ## bail if we're not supposed to create an example test html file
    return if not @exampleTestHtml

    @template "index.html", @config.get("testHtml")

module.exports = ConfigGenerator