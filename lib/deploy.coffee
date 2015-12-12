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
NwBuilder      = require("nw-builder")
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
expect         = require("chai").expect

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

log = (msg, color = "yellow") ->
  return if process.env["NODE_ENV"] is "test"
  console.log gutil.colors[color](msg), gutil.colors.bgWhite(gutil.colors.black(@platform))

class Platform
  constructor: (@platform, @options = {}) ->
    _.defaults @options,
      runTests:         true
      version:          null
      publisher:        null
      publisherOptions: {}
      platform:         @platform

  afterBuild: ->
    @log("#afterBuild")

    Promise.resolve()

  getVersion: ->
    @options.version ?
      fs.readJsonSync("./package.json").version ?
          throw new Error("Platform#version was not defined!")

  getLatestChromiumVersion: ->
    requestPromise(config.app.chromium_manifest_url, {json: true})
    .promise()
    .get("version")

  untarChromium: (pathToChromiumFile) ->
    @log("#untar")

    ## read from chromium.tar.gz and untar
    ## and extract into ./bin/chromium
    rs = fs.createReadStream(pathToChromiumFile)
    .pipe(zlib.createGunzip())
    .pipe(tar.extract(@buildPathToChromiumDir()))

    stp(rs)

  downloadChromium: (pathToChromiumFile) ->
    @log("#downloadChromium")

    osName = switch @platform
      when "osx64"    then "mac"
      when "linux64"  then "linux64"

    url = config.app.chromium_url + "?os=#{osName}"

    dir = path.dirname(pathToChromiumFile)

    fs.ensureDirAsync(dir).then =>
      ## go download chromium
      r = request(url)

      ## store this in tar in the cache
      .pipe(fs.createWriteStream(pathToChromiumFile))

      stp(r).return(pathToChromiumFile)

  handleChromium: ->
    @log("#handleChromium")

    ## get the latest chromium version
    @getLatestChromiumVersion().then (version) =>
      pathToChromiumFile = path.join(cacheDir, "chromium", version, @platform, tarName)

      untar = =>
        @untarChromium(pathToChromiumFile)

      ## see if we have this version cached
      fs.statAsync(pathToChromiumFile)
        .then(untar)
        .catch =>
          @downloadChromium(pathToChromiumFile)
          .then(untar)

  copyFiles: ->
    @log("#copyFiles")

    copy = (src, dest) =>
      dest ?= src
      dest = @distDir(dest.slice(1))

      fs.copyAsync(src, dest)

    fs
      .removeAsync(@distDir())
      .bind(@)
      .then ->
        fs.ensureDirAsync(@distDir())
      .then ->
        [
          ## copy root files
          copy("./package.json")
          copy("./config/app.yml")
          copy("./lib/html")
          copy("./lib/public")
          copy("./lib/scaffold")
          copy("./nw/public")
          copy("./lib/secret_sauce.bin")

          ## copy coffee src files
          copy("./lib/backend.coffee",      "/src/lib/backend.coffee")
          copy("./lib/cli.coffee",          "/src/lib/cli.coffee")
          copy("./lib/config.coffee",       "/src/lib/config.coffee")
          copy("./lib/cypress.coffee",      "/src/lib/cypress.coffee")
          copy("./lib/controllers",         "/src/lib/controllers")
          copy("./lib/util",                "/src/lib/util")
          copy("./lib/routes",              "/src/lib/routes")
          copy("./lib/sauce",               "/src/lib/sauce")
          copy("./lib/cache.coffee",        "/src/lib/cache.coffee")
          copy("./lib/id_generator.coffee", "/src/lib/id_generator.coffee")
          copy("./lib/keys.coffee",         "/src/lib/keys.coffee")
          copy("./lib/logger.coffee",       "/src/lib/logger.coffee")
          copy("./lib/project.coffee",      "/src/lib/project.coffee")
          copy("./lib/server.coffee",       "/src/lib/server.coffee")
          copy("./lib/socket.coffee",       "/src/lib/socket.coffee")
          copy("./lib/support.coffee",      "/src/lib/support.coffee")
          copy("./lib/request.coffee",      "/src/lib/request.coffee")
          copy("./lib/fixtures.coffee",     "/src/lib/fixtures.coffee")
          copy("./lib/watchers.coffee",     "/src/lib/watchers.coffee")
          copy("./lib/updater.coffee",      "/src/lib/updater.coffee")
          copy("./lib/reporter.coffee",     "/src/lib/reporter.coffee")
          copy("./lib/environment.coffee",  "/src/lib/environment.coffee")
          copy("./lib/log.coffee",          "/src/lib/log.coffee")
          copy("./lib/exception.coffee",    "/src/lib/exception.coffee")
          copy("./lib/chromium.coffee",     "/src/lib/chromium.coffee")

          ## copy nw_spec files
          copy("./spec")

          ## copy bower components for testing
          copy("./bower_components")

        ]
      .all()

  convertToJs: ->
    @log("#convertToJs")

    ## grab everything in src
    ## convert to js
    new Promise (resolve, reject) =>
      gulp.src(@distDir("src/**/*.coffee"))
        .pipe $.coffee()
        .pipe gulp.dest(@distDir("src"))
        .on "end", resolve
        .on "error", reject

  distDir: (src) ->
    args = _.compact [distDir, @platform, src]
    path.join args...

  obfuscate: ->
    @log("#obfuscate")

    ## obfuscate all the js files
    new Promise (resolve, reject) =>
      ## grab all of the js files
      files = glob.sync @distDir("src/**/*.js")

      ## root is src
      ## entry is cypress.js
      ## files are all the js files
      opts = {root: @distDir("src"), entry: @distDir("src/lib/cypress.js"), files: files}

      obfuscator = require('obfuscator').obfuscator
      obfuscator opts, (err, obfuscated) =>
        return reject(err) if err

        ## move to lib
        fs.writeFileSync(@distDir("lib/cypress.js"), obfuscated)

        resolve(obfuscated)

  cleanupSpec: ->
    @log("#cleanupSpec")

    fs.removeAsync @distDir("/spec")

  cleanupSrc: ->
    @log("#cleanupSrc")

    fs.removeAsync @distDir("/src")

  cleanupBc: ->
    @log("#cleanupBc")

    fs.removeAsync @distDir("/bower_components")

  cleanupPlatform: ->
    @log("#cleanupPlatform")

    fs.removeAsync path.join(buildDir, @platform)

  runTests: ->
    if @options.runTests is false
      return Promise.resolve()

    Promise.bind(@).then(@nwTests)

  runChromiumSmokeTest: ->
    @log("#runChromiumSmokeTest")

    @getLatestChromiumVersion().then (version) =>
      new Promise (resolve, reject) =>
        env = _.clone(process.env)
        env.CYPRESS_ENV = ""

        opts = {env: env}

        child_process.exec "#{@buildPathToApp()} --get-chromium-version", opts, (err, stdout, stderr) ->
          [err, stdout, stderr].forEach (val) ->
            console.log(val) if val

          return reject(err) if err

          stdout = stdout.replace(/\s/, "")

          if stdout isnt version
            throw new Error("Chromium version: '#{stdout}' did not match expected version: '#{version}'")
          else
            resolve()

  _nwTests: (options = {}) ->
    _.defaults options,
      project: false
      cli: false

    # new Promise (resolve, reject) =>
    #   retries = 0

    #   nwTests = =>
    #     retries += 1

    #     # tests = "../../node_modules/.bin/nw ./spec/nw_unit --headless"# --index=#{indexPath}"
    #     args = ["../../node_modules/.bin/nw", "./spec/nw_unit", "--headless"]

    #     switch
    #       when options.project
    #         args.push "--project"
    #       when options.cli
    #         args.push "--cli"

    #     console.log args.join(" ")
    #     spawn = child_process.exec args.join(" "), {cwd: @distDir(), stdio: "inherit"}, (err, stdout, stderr) ->


    #     spawn.on "exit", (failures) ->
    #       console.log "exit failures are", failures

    #     spawn.on "close", (failures) ->
    #       console.log "failures are", failures
          # retry = (failures) ->
          #   if retries is 5
          #     if failures instanceof Error
          #       err = failures
          #     else
          #       err = new Error("Mocha failed with '#{failures}' failures")
          #     return reject(err)

          #   console.log gutil.colors.red("'nwTests' failed, retrying")
          #   nwTests()

          # if failures is 0
          #   console.log gutil.colors.green("'nwTests' passed with #{failures} failures")
          #   resolve()
          # else
          #   retry(failures)

    new Promise (resolve, reject) =>
      retries = 0

      nwTests = =>
        retries += 1

        tests = "../../node_modules/.bin/nw ./spec/nw_unit --headless"# --index=#{indexPath}"

        switch
          when options.project
            tests += " --nw-spec project"
          when options.cli
            tests += " --nw-spec cli"

        child_process.exec tests, {cwd: @distDir()}, (err, stdout, stderr) =>
        # child_process.spawn "../../node_modules/.bin/nw", ["./spec/nw_unit", "--headless"], {cwd: @distDir(), stdio: "inherit"}, (err, stdout, stderr) ->
          console.log "err", err
          console.log "stdout", stdout
          console.log "stderr", stderr

          retry = (failures) ->
            if retries is 5
              if failures instanceof Error
                err = failures
              else
                err = new Error("Mocha failed with '#{failures}' failures")
              return reject(err)

            console.log gutil.colors.red("'nwTests' failed, retrying"), gutil.colors.magenta(tests)
            nwTests()

          results = @distDir("spec/results.json")

          fs.readJsonAsync(results)
            .then (failures) ->
              if failures is 0
                fs.removeSync(results)

                console.log gutil.colors.green("'nwTests' passed with #{failures} failures")
                resolve()
              else
                retry(failures)
            .catch(retry)

      nwTests()

  nwTests: ->
    @log("#nwTests")

    @_nwTests()
    .bind(@)
    .then -> @_nwTests({cli: true})
    .then -> @_nwTests({project: true})

  ## add tests around this method
  updatePackage: ->
    @log("#updatePackage")

    version = @options.version

    fs.readJsonAsync(@distDir("package.json")).then (json) =>
      json.env = "production"
      json.version = version if version
      json.scripts = {}

      delete json.devDependencies
      delete json.bin

      fs.writeJsonAsync(@distDir("package.json"), json)

  npmInstall: ->
    @log("#npmInstall")

    new Promise (resolve, reject) =>
      attempts = 0

      # pathToPackageDir = _.once =>
        ## return the path to the directory containing the package.json
        # packages = glob.sync(@distDir("package.json"), {nodir: true})
        # path.dirname(packages[0])

      npmInstall = =>
        attempts += 1

        child_process.exec "npm install --production", {cwd: @distDir()}, (err, stdout, stderr) ->
          if err
            if attempts is 3
              fs.writeFileSync("./npm-install.log", stderr)
              return reject(err)

            console.log gutil.colors.red("'npm install' failed, retrying")
            return npmInstall()

          resolve()

      npmInstall()

  nwBuilder: ->
    @log("#nwBuilder")

    nw = new NwBuilder
      files: @distDir("/**/*")
      platforms: [@platform]
      buildDir: buildDir
      buildType: => @getVersion()
      version: "0.12.2"
      macIcns: "nw/public/img/cypress.icns"
      macPlist: {
        CFBundleIdentifier: "com.cypress.io"
      }
      # macZip: true
      zip: false

    nw.on "log", console.log

    nw.build()

  uploadFixtureToS3: ->
    @log("#uploadFixtureToS3")

    @uploadToS3("osx64", "fixture")

  getManifest: ->
    requestPromise(config.app.desktop_manifest_url).then (resp) ->
      console.log resp

  cleanupDist: ->
    @log("#cleanupDist")

    fs.removeAsync(@distDir())

  build: ->
    Promise.bind(@)
      .then(@cleanupPlatform)
      .then(@gulpBuild)
      .then(@copyFiles)
      .then(@updatePackage)
      .then(@convertToJs)
      .then(@obfuscate)
      .then(@cleanupSrc)
      .then(@npmInstall)

  dist: ->
    Promise.bind(@)
      .then(@build)
      .then(@runTests)
      .then(@cleanupSpec)
      .then(@cleanupBc)
      .then(@nwBuilder)
      .then(@afterBuild)
      .then(@cleanupDist)
      .then(@handleChromium)
      .then(@runSmokeTest)
      .then(@runChromiumSmokeTest)
      .then(@codeSign) ## codesign after running smoke tests due to changing .cy
      .then(@verifyAppCanOpen)

  fixture: (cb) ->
    @dist()
      .then(@uploadFixtureToS3)
      .then(@cleanupPlatform)
      .then ->
        @log("Fixture Complete!", "green")
        cb?()
      .catch (err) ->
        @log("Fixture Failed!", "red")
        console.log err

  log: ->
    log.apply(@, arguments)

  manifest: ->
    Promise.bind(@)
      .then(@copyFiles)
      .then(@setVersion)
      .then(@updateS3Manifest)
      .then(@cleanupDist)

  gulpBuild: ->
    @log "gulpBuild"

    new Promise (resolve, reject) ->
      runSequence ["client:build", "nw:build"], ["client:minify", "nw:minify"], (err) ->
        if err then reject(err) else resolve()

  verifyAppCanOpen: ->
    Promise.resolve()

  _runSmokeTest: (pkgWindow) ->
    @log("#runSmokeTest")

    smokeTest = =>
      new Promise (resolve, reject) =>
        rand = "" + Math.random()

        child_process.exec "#{@buildPathToApp()} --smoke-test --ping=#{rand}", (err, stdout, stderr) ->
          stdout = stdout.replace(/\s/, "")

          return reject(err) if err

          if stdout isnt rand
            throw new Error("Stdout: '#{stdout}' did not match the random number: '#{rand}'")
          else
            resolve()

    verifyAppPackage = =>
      new Promise (resolve, reject) =>
        child_process.exec "#{@buildPathToApp()} --return-pkg", (err, stdout, stderr) ->
          return reject(err) if err

          stdout = JSON.parse(stdout)

          try
            expect(stdout.window).to.deep.eq(pkgWindow)
          catch err
            console.log(stdout.window)
            console.log(pkgWindow)
            return reject(err)

          try
            expect(stdout.env).to.eq("production")
          catch err
            console.log(stdout)
            return reject(err)

          resolve()

    smokeTest().then(verifyAppPackage)

class Osx64 extends Platform
  buildPathToApp: ->
    path.join buildDir, @getVersion(), @platform, "Cypress.app", "Contents", "MacOS", "Cypress"

  buildPathToChromium: ->
    path.join @buildPathToChromiumDir(), "Chromium.app", "Contents", "MacOS", "Electron"

  buildPathToChromiumDir: ->
    path.join buildDir, @getVersion(), @platform, "Cypress.app", "Contents", "Resources", "app.nw", "bin", "chromium"

  verifyAppCanOpen: ->
    @log("#verifyAppCanOpen")

    pathToApp = path.join buildDir, @getVersion(), @platform, "Cypress.app"
    pathToChr = path.join @buildPathToChromiumDir(), "Chromium.app"

    spctl = (p) ->
      new Promise (resolve) ->
        sp = child_process.spawn "spctl", ["-a", p], {stdio: "inherit"}
        sp.on "exit", (code) ->
          if code is 0
            resolve()
          else
            throw new Error("Verifying App via GateKeeper failed")

    Promise.map [pathToApp, pathToChr], spctl

  runSmokeTest: ->
    @_runSmokeTest({
      icon: "nw/public/img/cypress.iconset/icon_256x256@2x.png"
      title: "Cypress"
      frame: false
      toolbar: false
      show: false
      show_in_taskbar: false
      height: 400
      width: 300
    })

  afterBuild: ->
    @log("#afterBuild")

    Promise.all([
      @renameNwjsExecutable()
      @renameNwjsExecutablePlist()
      # @renameFolders()
    ])
  #     .bind(@)
  #     .then(@renameNwjsHelpers)
  #     .then(@renameNwjsHelperPlists)

  # renameFolder: (folder) ->
  #   fs.renameAsync(folder, folder.replace("nwjs", "cy"))

  # renameFolders: ->
  #   folders = @buildPathToApp().replace(/MacOS\/Cypress$/, "Frameworks/nwjs Helper.app")

  #   Promise.promisify(glob)(folders)
  #     .bind(@)
  #     .then (files) =>
  #       Promise.map(files, @renameFolder)

  # renameNwjsHelper: (file) ->
  #   fs.renameAsync file, file.replace(/nwjs(?!.*nwjs)/, "cy")

  # renameNwjsPlist: (file) ->
  #   plist = require("plist")

  #   ## after build we want to rename the nwjs executable
  #   ## and update the plist settings
  #   fs.readFileAsync(file, "utf8").then (contents) ->
  #     obj = plist.parse(contents)
  #     obj.CFBundleName        = obj.CFBundleName.replace("nwjs",          "cy")
  #     obj.CFBundleExecutable  = obj.CFBundleExecutable.replace("nwjs",    "cy")
  #     obj.CFBundleDisplayName = obj.CFBundleDisplayName.replace("nwjs",   "cy")
  #     obj.CFBundleIdentifier  = obj.CFBundleIdentifier.replace("nwjs.nw", "cy")

  #     fs.writeFileAsync(file, plist.build(obj))

  # renameNwjsHelpers: ->
  #   helpers = @buildPathToApp().replace(/MacOS\/Cypress$/, "Frameworks/**/nwjs Helper")

  #   Promise.promisify(glob)(helpers)
  #     .bind(@)
  #     .then (files) =>
  #       Promise.map(files, @renameNwjsHelper)

  # renameNwjsHelperPlists: ->
  #   plists = @buildPathToApp().replace(/MacOS\/Cypress$/, "Frameworks/**/Info.plist")

  #   Promise.promisify(glob)(plists)
  #     .bind(@)
  #     .then (files) =>
  #       Promise.map(files, @renameNwjsPlist)

  renameNwjsExecutable: ->
    dest = @buildPathToApp()
    src  = dest.replace(/Cypress$/, "nwjs")
    fs.renameAsync(src, dest)

  renameNwjsExecutablePlist: ->
    plist = require("plist")

    pathToPlist = path.join(buildDir, @getVersion(), @platform, "Cypress.app", "Contents", "Info.plist")

    ## after build we want to rename the nwjs executable
    ## and update the plist settings
    fs.readFileAsync(pathToPlist, "utf8").then (contents) ->
      obj = plist.parse(contents)
      obj.CFBundleExecutable = "Cypress"
      fs.writeFileAsync(pathToPlist, plist.build(obj))

  codeSign: ->
    @log("#codeSign")

    appPath = path.join buildDir, @getVersion(), @platform, "Cypress.app"

    new Promise (resolve, reject) ->
      sp = child_process.spawn "sh", ["./support/codesign.sh", appPath], {stdio: "inherit"}
      sp.on "exit", (code) ->
        if code is 0
          resolve()
        else
          throw new Error("Code Signing failed.")

  deploy: ->
    @dist()

class Linux64 extends Platform
  buildPathToApp: ->
    path.join buildDir, @getVersion(), @platform, "Cypress", "Cypress"

  buildPathToChromium: ->
    path.join @buildPathToChromiumDir(), "Chromium"

  buildPathToChromiumDir: ->
    path.join buildDir, @getVersion(), @platform, "Cypress", "bin", "chromium"

  codeSign: ->
    Promise.resolve()

  nwTests: ->
    xvfb = new Xvfb()
    xvfb = Promise.promisifyAll(xvfb)
    xvfb.startAsync()
      .then (xvfxProcess) =>
        super.then ->
          xvfb.stopAsync()

  runSmokeTest: ->
    xvfb = new Xvfb()
    xvfb = Promise.promisifyAll(xvfb)
    xvfb.startAsync().then (xvfxProcess) =>
      @_runSmokeTest({
        icon: "nw/public/img/cypress.iconset/icon_256x256@2x.png"
        title: "Cypress"
        toolbar: false
        frame: true
        show: true
        show_in_taskbar: true
        height: 400
        width: 300
      }).then ->
        xvfb.stopAsync()

  runChromiumSmokeTest: ->
    xvfb = new Xvfb()
    xvfb = Promise.promisifyAll(xvfb)
    xvfb.startAsync().then (xvfxProcess) =>
      super.then ->
        xvfb.stopAsync()

  nwBuilder: ->
    src    = path.join(buildDir, @getVersion(), @platform)
    dest   = path.join(buildDir, @getVersion(), "Cypress")
    mvDest = path.join(buildDir, @getVersion(), @platform, "Cypress")

    super.then ->
      fs.renameAsync(src, dest).then ->
        fs.ensureDirAsync(src).then ->
          fs.moveAsync(dest, mvDest, {clobber: true})

  npm: ->
    new Promise (resolve, reject) ->
      vagrant.ssh ["-c", "cd /cypress-app && npm install"], (code) ->
        if code isnt 0
          reject("vagrant.rsync failed!")
        else
          resolve()

  rsync: ->
    new Promise (resolve, reject) ->
      vagrant.rsync (code) ->
        if code isnt 0
          reject("vagrant.rsync failed!")
        else
          resolve()

  rsyncBack: ->
    new Promise (resolve, reject) ->
      vagrant["rsync-back"] (code) ->
        if code isnt 0
          reject("vagrant.rsync-back failed!")
        else
          resolve()

  deploy: ->
    version = @options.version

    getOpts = =>
      if @options.runTests is false
        "--skip-tests"
      else
        ""

    deploy = =>
      new Promise (resolve, reject) =>
        ssh = ->
          vagrant.ssh ["-c", "cd /cypress-app && gulp dist --version #{version} #{getOpts()}"], (code) ->
            if code isnt 0
              reject("vagrant.ssh gulp dist failed!")
            else
              resolve()

        vagrant.status (code) ->
          if code isnt 0
            vagrant.up (code) ->
              reject("vagrant.up failed!") if code isnt 0
              ssh()
          else
            ssh()

    @rsync()
      .bind(@)
      .then(@npm)
      .then(deploy)
      .then(@rsyncBack)

module.exports = {
  Platform: Platform
  Osx64: Osx64
  Linux64: Linux64

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

  parseOptions: (argv) ->
    opts = minimist(argv.slice(2))
    opts.runTests = false if opts["skip-tests"]
    opts

  platform: ->
    {
      darwin: "osx64"
      linux:  "linux64"
    }[os.platform()] or throw new Error("OS Platform: '#{os.platform()}' not supported!")

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

  runTests: ->
    @getPlatform().runTests()

  runSmokeTest: ->
    @getPlatform().runSmokeTest()

  build: ->
    @getPlatform().build()

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