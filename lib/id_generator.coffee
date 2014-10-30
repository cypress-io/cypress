fs        = require("fs")
_         = require("underscore")
path      = require("path")
gutil     = require("gulp-util")
phantom   = require("node-phantom-simple")

testIdRegExp = /\[(.{3})\]$/

alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"

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
  id = createId()

  try
    appendTestId data.spec, data.title, id
  catch e
    gutil.beep()
    console.log gutil.colors.yellow("An error occured generating an ID for file: "), gutil.colors.blue(data.spec), gutil.colors.yellow(" for test: "), gutil.colors.blue(data.title)
    console.log gutil.colors.red(e.name), ": ", e.message
    return fn({message: e.message})

  fn(id)

getRandom = (alphabet) ->
  index = Math.floor(Math.random() * alphabet.length)
  alphabet[index]

createId = ->
  ids = _(3).times -> getRandom(alphabet)
  ids.join("")

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

openPhantom = ->
  ## we should pass the path to phantomjs during this create call
  ## since we cant assume its been exported to PATH
  phantom.create (err, ph) ->
    console.log "PhantomJS ready..."
    ph.createPage (err, page) ->
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
        console.log "PhantomJS done! status: #{status}, time: #{Date.now() - t}"

  # , {parameters: "remote-debugger-port": "9000", "remote-debugger-autorun": "yes"}

module.exports =
  getId: getId
  openPhantom: openPhantom