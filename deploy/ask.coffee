fs       = require("fs-extra")
Promise  = require("bluebird")
inquirer = require("inquirer")

fs = Promise.promisifyAll(fs)

module.exports = {

  getPlatformQuestion: ->
    [{
      name: "platform"
      type: "list"
      message: "Which OS should we deploy?"
      choices: [{
        name: "Mac"
        value: "darwin"
      },{
        name: "Linux"
        value: "linux"
      }]
    }]

  getQuestions: (version) ->
    [{
      name: "publish"
      type: "list"
      message: "Publish a new version? (currently: #{version})"
      choices: [{
        name: "Yes: set a new version and deploy new version."
        value: true
      },{
        name: "No:  just override the current deploy’ed version."
        value: false
      }]
    },{
      name: "version"
      type: "input"
      message: "Bump version to...? (currently: #{version})"
      default: ->
        a = version.split(".")
        v = a[a.length - 1]
        v = Number(v) + 1
        a.splice(a.length - 1, 1, v)
        a.join(".")
      when: (answers) ->
        answers.publish
    }]

  deployNewVersion: ->
    new Promise (resolve, reject) =>
      fs.readJsonAsync("./package.json").then (json) =>
        inquirer.prompt @getQuestions(json.version), (answers) =>
          ## set the new version if we're publishing!
          ## update our own local package.json as well
          if answers.publish
            # @updateLocalPackageJson(answers.version, json).then ->
            resolve(answers.version)
          else
            resolve(json.version)

  whichPlatform: ->
    new Promise (resolve, reject) =>
      inquirer.prompt @getPlatformQuestion(), (answers) =>
        resolve(answers.platform)

}