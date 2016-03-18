_        = require("lodash")
fs       = require("fs-extra")
glob     = require("glob")
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

  getReleases: (releases) ->
    [{
      name: "release"
      type: "list"
      message: "Release which version?"
      choices: _.map releases, (r) ->
        {
          name: r
          value: r
        }
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

  whichRelease: (distDir) ->
    new Promise (resolve, reject) =>
      ## realpath returns the absolute full path
      glob "*/package.json", {cwd: distDir, realpath: true}, (err, pkgs) =>
        return reject(err) if err

        Promise
        .map pkgs, (pkg) ->
          fs.readJsonAsync(pkg).get("version")
        .then (versions) =>
          versions = _.uniq(versions)

          inquirer.prompt @getReleases(versions), (answers) =>
            resolve(answers.release)

  whichPlatform: ->
    new Promise (resolve, reject) =>
      inquirer.prompt @getPlatformQuestion(), (answers) =>
        resolve(answers.platform)

}