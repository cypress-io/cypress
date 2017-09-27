## store the cwd
cwd = process.cwd()

path     = require("path")
_        = require("lodash")
os       = require("os")
chalk    = require("chalk")
Promise  = require("bluebird")
minimist = require("minimist")
la       = require("lazy-ass")
check    = require("check-more-types")
debug    = require("debug")("cypress:binary")
questionsRemain = require("@cypress/questions-remain")

zip      = require("./zip")
ask      = require("./ask")
bump     = require("./bump")
meta     = require("./meta")
build    = require("./build")
upload   = require("./upload")

success = (str) ->
  console.log chalk.bgGreen(" " + chalk.black(str) + " ")

fail = (str) ->
  console.log chalk.bgRed(" " + chalk.black(str) + " ")

zippedFilename = (platform) ->
  # TODO use .tar.gz for linux archive. For now to preserve
  # same file format as before use .zip
  if platform is "linux" then "cypress.zip" else "cypress.zip"

# goes through the list of properties and asks relevant question
# resolves with all relevant options set
# if the property already exists, skips the question
askMissingOptions = (properties = []) ->
  questions = {
    platform: ask.whichPlatform,
    version: ask.deployNewVersion,
    # note: zip file might not be absolute
    zip: ask.whichZipFile
  }
  return questionsRemain(_.pick(questions, properties))

## hack for @packages/server modifying cwd
process.chdir(cwd)

deploy = {
  meta:   meta

  parseOptions: (argv) ->
    opts = minimist(argv, {
      boolean: ["skip-clean"]
      default: {
        "skip-clean": false
      }
      alias: {
        skipClean: "skip-clean"
      }
    })
    opts.runTests = false if opts["skip-tests"]
    if not opts.platform and os.platform() == meta.platforms.linux
      # only can build Linux on Linux
      opts.platform = meta.platforms.linux

    # windows aliases
    if opts.platform == "win32" or opts.platform == "win" or opts.platform == "windows"
      opts.platform = meta.platforms.windows

    if not opts.platform and os.platform() == meta.platforms.windows
      # only can build Windows binary on Windows platform
      opts.platform = meta.platforms.windows

    # be a little bit user-friendly and allow aliased values
    if opts.platform == "mac"
      opts.platform = meta.platforms.darwin

    debug("parsed command line options")
    debug(opts)
    opts

  bump: ->
    ask.whichBumpTask()
    .then (task) ->
      switch task
        when "run"
          bump.run()
        when "version"
          ask.whichVersion(meta.distDir)
          .then (v) ->
            bump.version(v)

  release: ->
    ## read off the argv
    options = @parseOptions(process.argv)

    release = (version) =>
      upload.s3Manifest(version)
      .then ->
        success("Release Complete")
      .catch (err) ->
        fail("Release Failed")
        reject(err)

    if v = options.version
      release(v)
    else
      ask.whichRelease(meta.distDir)
      .then(release)

  build: (options) ->
    console.log('#build')
    options ?= @parseOptions(process.argv)

    askMissingOptions(['version', 'platform'])(options)
    .then ->
      build(options.platform, options.version, options)

  zip: (options) ->
    console.log('#zip')
    if !options then options = @parseOptions(process.argv)
    askMissingOptions(['platform'])(options)
    .then (options) ->
      zipDir = meta.zipDir(options.platform)
      options.zip = path.resolve(zippedFilename(options.platform))
      zip.ditto(zipDir, options.zip)

  upload: (options) ->
    console.log('#upload')
    if !options then options = @parseOptions(process.argv)
    askMissingOptions(['version', 'platform', 'zip'])(options)
    .then (options) ->
      la(check.unemptyString(options.zip),
        "missing zipped filename", options)
      options.zip = path.resolve(options.zip)
      options
    .then (options) ->
      console.log("Need to upload file %s", options.zip)
      console.log("for platform %s version %s",
        options.platform, options.version)

      upload.toS3({
        zipFile: options.zip,
        version: options.version,
        platform: options.platform
      })

  # goes through the entire pipeline:
  #   - build
  #   - zip
  #   - upload
  deploy: ->
    options = @parseOptions(process.argv)

    askMissingOptions(['version', 'platform'])(options)
    .then (options) =>
      @build(options)
      .then => @zip(options)
      # assumes options.zip contains the zipped filename
      .then => @upload(options)
}

module.exports = _.bindAll(deploy, _.functions(deploy))
