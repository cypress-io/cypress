config         = require("./config")
path           = require("path")
_              = require("lodash")
fs             = require("fs-extra")
Promise        = require("bluebird")
child_process  = require("child_process")
glob           = require("glob")
gulp           = require("gulp")
$              = require('gulp-load-plugins')()
gutil          = require("gulp-util")
inquirer       = require("inquirer")
requestPromise = require("request-promise")
request        = require("request")
os             = require("os")
vagrant        = require("vagrant")
runSequence    = require("run-sequence")
minimist       = require("minimist")
Xvfb           = require("xvfb")
tar            = require("tar-fs")
zlib           = require("zlib")
stp            = require("stream-to-promise")
obfuscator     = require("obfuscator")
pkgr           = require("electron-packager")
pkg            = require("../package.json")
cypressIcons   = require("cypress-icons")
expect         = require("chai").expect

pkgr           = Promise.promisify(pkgr)

vagrant.debug = true
["rsync", "rsync-auto", "rsync-back"].forEach (cmd) ->
  vagrant[cmd] = vagrant._runWithArgs(cmd)

fs = Promise.promisifyAll(fs)

require path.join(process.cwd(), "gulpfile.coffee")

distDir   = path.join(process.cwd(), "dist")
buildDir  = path.join(process.cwd(), "build")
cacheDir  = path.join(process.cwd(), "cache")
platforms = ["osx64", "linux64"]
zipName   = "cypress.zip"
tarName   = "chromium.tar.gz"

module.exports = {
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

  updateLocalPackageJson: (version, json) ->
    json ?= fs.readJsonSync("./package.json")
    json.version = version
    fs.writeJsonAsync("./package.json", json)

  askDeployNewVersion: ->
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

  getPlatformQuestion: ->
    [{
      name: "platform"
      type: "list"
      message: "Which OS should we deploy?"
      choices: [{
        name: "Mac"
        value: "osx64"
      },{
        name: "Linux"
        value: "linux64"
      }]
    }]

  askWhichPlatform: ->
    new Promise (resolve, reject) =>
      inquirer.prompt @getPlatformQuestion(), (answers) =>
        resolve(answers.platform)

  cleanupEachPlatform: (platforms) ->
    Promise
      .map(platforms, @cleanupPlatform)
      .bind(@)

  deployPlatform: (platform, options) ->
    @getPlatform(platform, options).deploy()

  getPlatform: (platform, options) ->
    platform ?= @platform()

    Platform = @[platform.slice(0, 1).toUpperCase() + platform.slice(1)]

    throw new Error("Platform: '#{platform}' not found") if not Platform

    options ?= @parseOptions(process.argv)

    (new Platform(platform, options))

  zip: (platform, options) ->
    log.call(options, "#zip")

    appName = switch platform
      when "osx64"   then "Cypress.app"
      when "linux64" then "Cypress"
      else throw new Error("appName for platform: '#{platform}' not found!")

    root = "#{buildDir}/#{options.version}/#{platform}"

    new Promise (resolve, reject) =>
      zip = "ditto -c -k --sequesterRsrc --keepParent #{root}/#{appName} #{root}/#{zipName}"
      child_process.exec zip, {}, (err, stdout, stderr) ->
        return reject(err) if err

        resolve()

  getPublisher: ->
    aws = @getAwsObj()

    $.awspublish.create
      params: {
        Bucket:        aws.bucket
      }
      accessKeyId:     aws.key
      secretAccessKey: aws.secret

  getAwsObj: ->
    fs.readJsonSync("./support/aws-credentials.json")

  getUploadDirName: (version, platform, override) ->
    aws = @getAwsObj()

    aws.folder + "/" + (override or (version + "/" + platform)) + "/"

  uploadToS3: (platform, options, override) ->
    log.call(options, "#uploadToS3")

    new Promise (resolve, reject) =>
      {publisherOptions, version} = options

      publisher = @getPublisher()

      headers = {}
      headers["Cache-Control"] = "no-cache"

      gulp.src("#{buildDir}/#{version}/#{platform}/#{zipName}")
        .pipe $.rename (p) =>
          p.dirname = @getUploadDirName(version, platform, override)
          p
        .pipe $.debug()
        .pipe publisher.publish(headers, publisherOptions)
        .pipe $.awspublish.reporter()
        .on "error", reject
        .on "end", resolve

  cleanupDist: ->
    fs.removeAsync(distDir)

  cleanupBuild: ->
    fs.removeAsync(buildDir)

  runSmokeTest: ->
    @getPlatform().runSmokeTest()

  afterBuild: ->
    @getPlatform().afterBuild()

  dist: ->
    @cleanupDist().then =>
      @getPlatform(null).dist()

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

  createRemoteManifest: (folder, version) ->
    ## this isnt yet taking into account the os
    ## because we're only handling mac right now
    getUrl = (os) ->
      {
        url: [config.app.cdn_url, folder, version, os, zipName].join("/")
      }

    obj = {
      name: "Cypress"
      version: version
      packages: {
        mac: getUrl("osx64")
        win: getUrl("win64")
        linux64: getUrl("linux64")
      }
    }

    src = "#{buildDir}/manifest.json"
    fs.outputJsonAsync(src, obj).return(src)

  updateS3Manifest: (version) ->
    publisher = @getPublisher()
    options = @publisherOptions
    aws = @getAwsObj()

    headers = {}
    headers["Cache-Control"] = "no-cache"

    new Promise (resolve, reject) =>
      @createRemoteManifest(aws.folder, version).then (src) ->
        gulp.src(src)
          .pipe $.rename (p) ->
            p.dirname = aws.folder + "/" + p.dirname
            p
          .pipe $.debug()
          .pipe publisher.publish(headers, options)
          .pipe $.awspublish.reporter()
          .on "error", reject
          .on "end", resolve

  release: ->
    ## read off the argv
    options = @parseOptions(process.argv)

    new Promise (resolve, reject) =>
      release = (version) =>
        @updateS3Manifest(version)
          .bind(@)
          .then(@cleanupDist)
          .then(@cleanupBuild)
          .then ->
            console.log("Release Complete")
          .catch (err) ->
            console.log("Release Failed")
            console.log(err)
            reject(err)
          .then(resolve)

      if v = options.version
        release(v)
      else
        ## allow us to pass specific options here
        ## to force the release to a specific version
        ## or extend the getReleases to accept custom value
        releases = glob.sync("*", {cwd: buildDir})

        inquirer.prompt @getReleases(releases), (answers) =>
          release(answers.release)

  deploy: ->
    ## read off the argv
    options = @parseOptions(process.argv)

    deploy = (platform) =>
      @askDeployNewVersion()
        .then (version) =>
          options.version = version
          @deployPlatform(platform, options).then =>
            @zip(platform, options).then =>
              @uploadToS3(platform, options)
              .then ->
                console.log("Dist Complete")
              .catch (err) ->
                console.log("Dist Failed")
                console.log(err)

    @askWhichPlatform().bind(@).then(deploy)
}