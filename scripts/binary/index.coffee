## store the cwd
cwd = process.cwd()

path     = require("path")
_        = require("lodash")
os       = require("os")
gift     = require("gift")
chalk    = require("chalk")
Promise  = require("bluebird")
minimist = require("minimist")
la       = require("lazy-ass")
check    = require("check-more-types")
debug    = require("debug")("cypress:binary")
questionsRemain = require("@cypress/questions-remain")
R        = require("ramda")

zip      = require("./zip")
ask      = require("./ask")
bump     = require("./bump")
meta     = require("./meta")
build    = require("./build")
upload   = require("./upload")
uploadUtils = require("./util/upload")
{uploadNpmPackage} = require("./upload-npm-package")
{uploadUniqueBinary} = require("./upload-unique-binary")

## initialize on existing repo
repo = Promise.promisifyAll(gift(cwd))

success = (str) ->
  console.log chalk.bgGreen(" " + chalk.black(str) + " ")

fail = (str) ->
  console.log chalk.bgRed(" " + chalk.black(str) + " ")

zippedFilename = R.always(upload.zipName)

# goes through the list of properties and asks relevant question
# resolves with all relevant options set
# if the property already exists, skips the question
askMissingOptions = (properties = []) ->
  questions = {
    platform: ask.whichPlatform,
    version: ask.deployNewVersion,
    # note: zip file might not be absolute
    zip: ask.whichZipFile
    nextVersion: ask.nextVersion
    commit: ask.toCommit
  }
  pickedQuestions = _.pick(questions, properties)
  questionsRemain(pickedQuestions)

## hack for @packages/server modifying cwd
process.chdir(cwd)

commitVersion = (version) ->
  msg = "release #{version} [skip ci]"

  repo.commitAsync(msg, {
    'allow-empty': true,
  })

deploy = {
  meta:   meta

  parseOptions: (argv) ->
    opts = minimist(argv, {
      boolean: ["skip-clean"]
      default: {
        "skip-clean": false
      }
      alias: {
        skipClean: "skip-clean",
        zip: ["zipFile", "zip-file", "filename"]
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
          bump.runTestProjects()
        when "version"
          ask.whichVersion(meta.distDir(""))
          .then (v) ->
            bump.version(v)

  ## sets environment variable on each CI provider
  ## to NEXT version to build
  setNextVersion: ->
    options = @parseOptions(process.argv)

    askMissingOptions(['nextVersion'])(options)
    .then ({nextVersion}) ->
      bump.nextVersion(nextVersion)

  release: ->
    ## read off the argv
    options = @parseOptions(process.argv)

    release = ({ version, commit, nextVersion }) =>
      upload.s3Manifest(version)
      .then ->
        if commit
          commitVersion(version)
      .then ->
        bump.nextVersion(nextVersion)
      .then ->
        success("Release Complete")
      .catch (err) ->
        fail("Release Failed")
        throw err

    askMissingOptions(['version', 'commit', 'nextVersion'])(options)
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

  # upload Cypress NPM package file
  "upload-npm-package": (args = process.argv) ->
    console.log('#packageUpload')
    uploadNpmPackage(args)

  # upload Cypress binary zip file under unique hash
  "upload-unique-binary": (args = process.argv) ->
    console.log('#uniqueBinaryUpload')
    uploadUniqueBinary(args)

  # upload Cypress binary ZIP file
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

  # purge all platforms of a desktop app for specific version
  "purge-version": (args = process.argv) ->
    console.log('#purge-version')
    options = minimist(args, {
      string: 'version',
      alias: {
        version: 'v'
      }
    })
    la(check.unemptyString(options.version), "missing app version to purge", options)
    uploadUtils.purgeDesktopAppAllPlatforms(options.version, upload.zipName)

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
