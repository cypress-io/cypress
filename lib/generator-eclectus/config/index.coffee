Eclectus = require("../eclectus")

class ConfigGenerator extends Eclectus.Base
  askForConfig: ->
    ## if the path to the JS files already exists Ecl should scan the directory
    ## in order to fill out the other options
    question = [
      {
        name: "testPath"
        message: "What's the path to your JS tests?"
        default: "/tests"
      },{
        name: "testFiles"
        message: "Which files should I scan for? (this is a RegExp)"
        default: "/[.js|.coffee]$"
      },{
        name: "testHtml"
        message: "What's the path to your .html file?"
        default: "/tests/index.html"
      }
    ]

    @prompt question, (answers) =>
      @config.set answers
      @config.save()

module.exports = ConfigGenerator