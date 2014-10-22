fs        = require("fs")
_         = require("underscore")
path      = require("path")
gutil     = require("gulp-util")

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

getId = (data, fn = ->) ->
  id = createId()

  try
    appendTestId data.spec, data.title, id
  catch e
    gutil.beep()
    console.log gutil.colors.yellow("An error occured generating an ID for file: "), gutil.colors.blue(data.spec), gutil.colors.yellow(" for test: "), gutil.colors.blue(data.title)
    console.log gutil.colors.red(e.name), ": ", e.message
    return fn(e.message)

  fn(id)

getRandom = (alphabet) ->
  index = Math.floor(Math.random() * alphabet.length)
  alphabet[index]

createId = ->
  ids = _(3).times -> getRandom(alphabet)
  ids.join("")

module.exports = getId