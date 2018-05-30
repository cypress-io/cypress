_         = require("lodash")
Promise   = require("bluebird")
path      = require("path")
cypressEx = require("@packages/example")
log       = require("debug")("cypress:server:scaffold")
fs        = require("./util/fs")
glob      = require("./util/glob")
cwd       = require("./cwd")
debug     = require("debug")("cypress:server:scaffold")
{ equals, head, isEmpty, always } = require("ramda")
{ isDefault } = require("./util/config")

exampleFolderName = cypressEx.getFolderName()
getExampleSpecsFullPaths = cypressEx.getPathToExamples()

getPathFromIntegrationFolder = (file) ->
  file.substring(file.indexOf("integration/") + "integration/".length)

isDifferentNumberOfFiles = (files, exampleSpecs) ->
  files.length isnt exampleSpecs.length

getExampleSpecs = ->
  getExampleSpecsFullPaths
  .then (fullPaths) ->
    ## short paths relative to integration folder (i.e. examples/actions.spec.js)
    shortPaths = _.map fullPaths, (file) ->
      getPathFromIntegrationFolder(file)

    ## index for quick lookup and for getting full path from short path
    index = _.transform(shortPaths, (memo, spec, i) ->
      memo[spec] = fullPaths[i]
    , {})

    { fullPaths, shortPaths, index }

getIndexedExample = (file, index) ->
  index[getPathFromIntegrationFolder(file)]

filesNamesAreDifferent = (files, index) ->
  _.some files, (file) ->
    not getIndexedExample(file, index)

getFileSize = (file) ->
  fs.statAsync(file).get("size")

filesSizesAreSame = (files, index) ->
  Promise.join(
    Promise.all(_.map(files, getFileSize)),
    Promise.all(_.map(files, (file) -> getFileSize(getIndexedExample(file, index))))
  )
  .spread (fileSizes, originalFileSizes) ->
    _.every fileSizes, (size, i) ->
      size is originalFileSizes[i]

isNewProject = (integrationFolder) ->
  ## logic to determine if new project
  ## 1. there are no files in 'integrationFolder'
  ## 2. there is a different number of files in 'integrationFolder'
  ## 3. the files are named the same as the example files
  ## 4. the bytes of the files match the example files

  glob("**/*", { cwd: integrationFolder, realpath: true, nodir: true })
  .then (files) ->
    debug("found #{files.length} files in folder #{integrationFolder}")
    debug("determine if we should scaffold:")

    ## TODO: add tests for this
    debug("- empty?", isEmpty(files))
    return true if isEmpty(files) # 1

    getExampleSpecs()
    .then (exampleSpecs) ->
      numFilesDifferent = isDifferentNumberOfFiles(files, exampleSpecs.shortPaths)
      debug("- different number of files?", numFilesDifferent)
      return false if numFilesDifferent # 2

      filesNamesDifferent = filesNamesAreDifferent(files, exampleSpecs.index)
      debug("- different file names?", filesNamesDifferent)
      return false if filesNamesDifferent # 3

      filesSizesAreSame(files, exampleSpecs.index)
  .then (sameSizes) ->
    debug("- same sizes?", sameSizes)
    sameSizes

module.exports = {
  isNewProject

  integrationExampleName: -> exampleFolderName

  integration: (folder, config) ->
    debug("integration folder #{folder}")

    ## skip if user has explicitly set integrationFolder
    return Promise.resolve() if not isDefault(config, "integrationFolder")

    @verifyScaffolding folder, =>
      debug("copying examples into #{folder}")
      getExampleSpecs()
      .then ({ fullPaths }) =>
        Promise.all _.map fullPaths, (file) =>
          @_copy(file, path.join(folder, exampleFolderName), config)

  fixture: (folder, config) ->
    debug("fixture folder #{folder}")

    ## skip if user has explicitly set fixturesFolder
    return Promise.resolve() if not config.fixturesFolder or not isDefault(config, "fixturesFolder")

    @verifyScaffolding folder, =>
      debug("copying example.json into #{folder}")
      @_copy("fixtures/example.json", folder, config)

  support: (folder, config) ->
    debug("support folder #{folder}, support file #{config.supportFile}")

    ## skip if user has explicitly set supportFile
    return Promise.resolve() if not config.supportFile or not isDefault(config, "supportFile")

    @verifyScaffolding(folder, =>
      debug("copying commands.js and index.js to #{folder}")
      Promise.join(
        @_copy("support/commands.js", folder, config)
        @_copy("support/index.js", folder, config)
      )
    )

  plugins: (folder, config) ->
    debug("plugins folder #{folder}")

    ## skip if user has explicitly set pluginsFile
    if not config.pluginsFile or not isDefault(config, "pluginsFile")
      return Promise.resolve()

    @verifyScaffolding folder, =>
      debug("copying index.js into #{folder}")
      @_copy("plugins/index.js", folder, config)

  _copy: (file, folder, config) ->
    ## allow file to be relative or absolute
    src  = path.resolve(cwd("lib", "scaffold"), file)
    dest = path.join(folder, path.basename(file))

    @_assertInFileTree(dest, config)
    .then ->
      fs.copyAsync(src, dest)

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
    # console.debug('-- verify', folder)
    debug("verify scaffolding in #{folder}")
    fs.statAsync(folder)
    .then ->
      debug("folder #{folder} already exists")
    .catch =>
      debug("missing folder #{folder}")
      fn.call(@)

  fileTree: (config = {}) ->
    ## returns a tree-like structure of what files are scaffolded.
    ## this should be updated any time we add, remove, or update the name
    ## of a scaffolded file

    getFilePath = (dir, name) ->
      path.relative(config.projectRoot, path.join(dir, name))

    getExampleSpecs()
    .then (specs) =>
      files = _.map specs.shortPaths, (file) ->
        getFilePath(config.integrationFolder, file)

      if config.fixturesFolder
        files = files.concat([
          getFilePath(config.fixturesFolder, "example.json")
        ])

      if config.supportFolder and config.supportFile isnt false
        files = files.concat([
          getFilePath(config.supportFolder, "commands.js")
          getFilePath(config.supportFolder, "index.js")
        ])

      if config.pluginsFile
        files = files.concat([
          getFilePath(path.dirname(config.pluginsFile), "index.js")
        ])

      debug("scaffolded files %j", files)

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

    @fileTree(config)
    .then (fileTree) =>
      if not @_inFileTree(fileTree, relativeFilePath)
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
