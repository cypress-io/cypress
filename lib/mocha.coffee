Mocha     = require("mocha")
jQuery    = require("jquery-deferred")
fs        = require("fs")
_         = require("underscore")
path      = require("path")

testIdRegExp = /\[(.{3})\]$/

alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"

run = Mocha.Runner.prototype.run

Mocha.Runner.prototype.run = (spec) ->
  iterateThroughRunnables @suite, spec

iterateThroughRunnables = (runnable, spec) ->
  _.each [runnable.tests, runnable.suites], (array) =>
    _.each array, (item) =>
      generateId item, spec

generateId = (runnable, spec) ->
  return if runnable.root or runnable.added

  runnable.cid ?= getTestCid(runnable)

  if not runnable.cid
    data = {title: runnable.title, spec: spec}
    runnable.cid = getId(data)

escapeRegExp = (str) ->
  str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

appendTestId = (spec, title, id) ->
  contents = fs.readFileSync spec, "utf8"
  re = new RegExp "['\"](" + escapeRegExp(title) + ")['\"]"

  # ## if the string is found and it doesnt have an id
  matches = re.exec contents

  ## matches[1] will be the captured group which is the title
  if matches
    ## position is the string index where we first find the capture
    ## group and include its length, so we insert right after it
    position = matches.index + matches[1].length + 1
    contents = _(contents).insert position, " [#{id}]"

    ## enable editFileMode which prevents us from sending out test:changed events
    app.enable("editFileMode")

    ## write the actual contents to the file
    fs.writeFileSync spec, contents

    ## remove the editFileMode so we emit file changes again
    ## if we're still in edit file mode then wait 1 second and disable it
    ## chokidar doesnt instantly see file changes so we have to wait
    _.delay ->
      app.disable("editFileMode")
    , 1000

getId = (data) ->
  id = createId()
  appendTestId data.spec, data.title, id
  id

getRandom = (alphabet) ->
  index = Math.floor(Math.random() * alphabet.length)
  alphabet[index]

createId = ->
  ids = _(3).times -> getRandom(alphabet)
  ids.join("")

getTestCid = (test) ->
  ## grab the test id from the test's title
  matches = testIdRegExp.exec(test.title)

  ## use the captured group if there was a match
  matches and matches[1]

invalidateCachedFile = (filepath) ->
  delete require.cache[path.resolve(filepath)]

module.exports =

  generateIds: (filepath, strippedPath, app, cb) ->
    mocha = new Mocha

    ## remove the cached file so mocha reloads our spec
    invalidateCachedFile(filepath)

    mocha.addFile filepath

    mocha.run filepath
    cb()