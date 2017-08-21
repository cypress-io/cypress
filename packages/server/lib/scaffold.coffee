_         = require("lodash")
fs        = require("fs-extra")
Promise   = require("bluebird")
path      = require("path")
cypressEx = require("@packages/example")
glob      = require("glob")
cwd       = require("./cwd")
log       = require("debug")("cypress:server:scaffold")
{ propEq, complement, equals, compose, head, isEmpty, always } = require("ramda")
{ isDefault } = require("./util/config")

glob = Promise.promisify(glob)
fs = Promise.promisifyAll(fs)

INTEGRATION_EXAMPLE_SPEC = cypressEx.getPathToExample()
INTEGRATION_EXAMPLE_NAME = path.basename(INTEGRATION_EXAMPLE_SPEC)

## we are assuming example spec is a single file for now
numberOfExampleSpecs = 1

# a few utility functions for quickly comparing list of files
# to number of expected example files
isOneFile = propEq('length', numberOfExampleSpecs)
isNotOneFile = complement(isOneFile)
isFileNameDefault = compose(
  equals(INTEGRATION_EXAMPLE_NAME),
  path.basename
)

# TODO why isn't R.complement(isFileNameDefault) working?!
isFileNameChanged = (filename) -> !isFileNameDefault(filename)

integrationExampleSize = ->
  fs
  .statAsync(INTEGRATION_EXAMPLE_SPEC)
  .get("size")

isNewProject = (integrationFolder) ->
  ## logic to determine if new project
  ## 1. there are no files in 'integrationFolder'
  ## 2. there is only 1 file in 'integrationFolder'
  ## 3. the file is called 'example_spec.js'
  ## 4. the bytes of the file match lib/scaffold/example_spec.js
  getCurrentSize = (file) ->
    fs
    .statAsync(file)
    .get("size")

  glob("**/*", { cwd: integrationFolder, realpath: true })
  .then (files) ->
    log "found #{files.length} files in folder #{integrationFolder}"
    ## TODO: add tests for this
    return true if isEmpty(files) # 1

    return false if isNotOneFile(files) # 2

    exampleSpec = head(files)
    log "Checking spec filename if default #{exampleSpec}"

    return false if isFileNameChanged(exampleSpec) # 3

    log "Checking spec file size #{exampleSpec}"
    # 4
    Promise.join(
      getCurrentSize(exampleSpec),
      integrationExampleSize(),
      equals
    )

module.exports = {
  isNewProject

  integration: (folder, config) ->
    log "integration folder #{folder}"

    ## skip if user has explicitly set integrationFolder
    return Promise.resolve() if not isDefault(config, "integrationFolder")

    @verifyScaffolding folder, =>
      log "copying examples into #{folder}"
      @_copy(INTEGRATION_EXAMPLE_SPEC, folder, config)

  fixture: (folder, config) ->
    log "fixture folder #{folder}"

    ## skip if user has explicitly set fixturesFolder
    return Promise.resolve() if not config.fixturesFolder or not isDefault(config, "fixturesFolder")

    @verifyScaffolding folder, =>
      log "fixture needs to copy example.json"
      @_copy("example.json", folder, config)

  support: (folder, config) ->
    log "support folder #{folder}, support file #{config.supportFile}"

    ## skip if user has explicitly set supportFile
    return Promise.resolve() if not config.supportFile or not isDefault(config, "supportFile")
    # return Promise.resolve() if not isDefault(config, "supportFile")

    @verifyScaffolding(folder, =>
      log "copying defaults and commands to #{folder}"
      Promise.join(
        @_copy("defaults.js", folder, config)
        @_copy("commands.js", folder, config)
        @_copy("index.js", folder, config)
      )
    )

  _copy: (file, folder, config) ->
    ## allow file to be relative or absolute
    src  = path.resolve(cwd("lib", "scaffold"), file)
    dest = path.join(folder, path.basename(file))

    @_assertInFileTree(dest, config)

    fs.copyAsync(src, dest)

  integrationExampleSize

  integrationExampleName: always(INTEGRATION_EXAMPLE_NAME)

  verifyScaffolding: (folder, fn) ->
    ## we want to build out the folder + and example files
    ## but only create the example files if the folder doesn't
    ## exist
    ##
    ## this allows us to automatically insert the folder on existing
    ## projects (whenever they are booted) but allows the user to delete
    ## the file and not have it re-generated each time
    ##
    ## this is ideal because users who are upgrading to newer cypress version
    ## will still get the files scaffolded but existing users won't be
    ## annoyed by new example files coming into their projects unnecessarily
    # console.log('-- verify', folder)
    log "verify scaffolding in #{folder}"
    fs.statAsync(folder)
    .catch =>
      log "missing folder #{folder}"
      fn.call(@)

  fileTree: (config = {}) ->
    ## returns a tree-like structure of what files are scaffolded.
    ## this should be updated any time we add, remove, or update the name
    ## of a scaffolded file

    getFilePath = (dir, name) ->
      path.relative(config.projectRoot, path.join(dir, name))

    log("example spec from integration folder %s", config.integrationFolder)
    files = [
      getFilePath(config.integrationFolder, "example_spec.js")
    ]

    if config.fixturesFolder and config.fixturesFolder isnt false
      files = files.concat([
        getFilePath(config.fixturesFolder, "example.json")
      ])

    if config.supportFolder and config.supportFile isnt false
      log "supporting files from folder #{config.supportFolder}"
      files = files.concat([
        getFilePath(config.supportFolder, "commands.js")
        getFilePath(config.supportFolder, "defaults.js")
        getFilePath(config.supportFolder, "index.js")
      ])
    log("scaffolded files %j", files)

    return @_fileListToTree(files)

  _fileListToTree: (files) ->
    ## turns a list of file paths into a tree-like structure where
    ## each entry has a name and children if it's a directory

    _.reduce files, (tree, file) ->
      placeholder = tree
      parts = file.split("/")
      _.each parts, (part, index) ->
        if not entry = _.find(placeholder, {name: part})
          entry = {name: part}
          if index < parts.length - 1
            ## if it's not the last, it's a directory
            entry.children = []

          placeholder.push(entry)

        placeholder = entry.children

      return tree
    , []

  _assertInFileTree: (filePath, config) ->
    relativeFilePath = path.relative(config.projectRoot, filePath)

    if not @_inFileTree(@fileTree(config), relativeFilePath)
      throw new Error("You attempted to scaffold a file, '#{relativeFilePath}', that's not in the scaffolded file tree. This is because you added, removed, or changed a scaffolded file. Make sure to update scaffold#fileTree to match your changes.")

  _inFileTree: (fileTree, filePath) ->
    branch = fileTree
    parts = filePath.split("/")
    for part in parts
      if found = _.find(branch, {name: part})
        branch = found.children
      else
        return false

    return true
}
