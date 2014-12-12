fs        = require 'fs'
_         = require 'underscore'
path      = require 'path'
gutil     = require 'gulp-util'
phantom   = require 'node-phantom-simple'
Promise   = require 'bluebird'
testIdRegExp = /\[(.{3})\]$/
keys      = require './keys'

escapeRegExp = (str) ->
  str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

appendTestId = (spec, title, id) ->
  contents = fs.readFileSync spec, "utf8"
  re = new RegExp "['\"](" + escapeRegExp(title) + ")['\"]"

  # ## if the string is found and it doesnt have an id
  matches = re.exec contents

  ## matches[1] will be the captured group which is the title
  return if not matches

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

getId = (data, fn = ->) ->
  keys.getNew()
  .then (id) ->
    try
      appendTestId data.spec, data.title, id
    catch e
      gutil.beep()
      console.log gutil.colors.yellow("An error occured generating an ID for file: "), gutil.colors.blue(data.spec), gutil.colors.yellow(" for test: "), gutil.colors.blue(data.title)
      console.log gutil.colors.red(e.name), ": ", e.message
      return fn({message: e.message})

    fn(id)

parseStackTrace = (trace) ->
  _.reduce trace, (memo, obj) ->
    str = " --> #{obj.file}: #{obj.line}"
    str += " (in function #{obj.function})" if obj.function
    memo.push str
    memo
  , []

parseFileFromStackTrace = (trace, rootPath) ->
  return "Unknown file (could not read from stack trace)" if not trace.length

  trace[0].file.replace(rootPath, "")

createPhantom = ->
  new Promise (resolve, reject) ->
    phantom.create (err, ph) ->
      console.log "PhantomJS ready..."

      return reject(err) if err

      resolve(ph)

createPhantomPage = (ph) ->
  new Promise (resolve, reject) ->
    ph.createPage (err, page) ->
      return reject(err) if err

      resolve(page)

visitIdPage = (page) ->
  new Promise (resolve, reject) ->
    t = Date.now()
    rootPath = "http://localhost:#{app.get('port')}/"
    pathToPage = rootPath + "id_generator"
    console.log "PhantomJS opened: ", pathToPage

    # page.onConsoleMessage = (msg, lineNum, sourceId) ->
    #   debugger

    page.onError = (msg, trace) ->
      gutil.beep()
      stack = parseStackTrace(trace)
      file = parseFileFromStackTrace(trace, rootPath)

      ## need to convert this into a function so we can automatically
      ## log out the total length of the errors and generate the bar wrappers
      ## around them
      console.log ""
      console.log "========================================"
      console.log gutil.colors.yellow("An error occured generating ids in file: "), gutil.colors.blue(file)
      console.log gutil.colors.red(msg)
      console.log(stack.join("\n")) if stack.length
      console.log "========================================"

    page.open pathToPage, (err, status) ->
      return reject(err) if err
      console.log "PhantomJS done! status: #{status}, time: #{Date.now() - t}"
      resolve()

openPhantom = ->
  createPhantom()
  .then(createPhantomPage)
  .then(visitIdPage)
  # , {parameters: "remote-debugger-port": "9000", "remote-debugger-autorun": "yes"}

module.exports =
  getId: getId
  openPhantom: openPhantom
