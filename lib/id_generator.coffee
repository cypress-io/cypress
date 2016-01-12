path            = require("path")
_               = require("underscore")
str             = require("underscore.string")
PSemaphore      = require("promise-semaphore")
gutil           = require("gulp-util")
Promise         = require("bluebird")
Keys            = require("./keys")
Log             = require("./log")
escapeRegExp    = require("./util/escape_regexp")

fs              = Promise.promisifyAll(require('fs'))
pSemaphore       = new PSemaphore()

class IdGenerator
  constructor: (app) ->
    if not (@ instanceof IdGenerator)
      return new IdGenerator(app)

    if not app
      throw new Error("Instantiating lib/id_generator requires an app!")

    @app         = app
    @projectRoot = @app.get("cypress").projectRoot
    @keys        = Keys(@projectRoot)

  read: (path) ->
    fs.readFileAsync(path, "utf8")

  write: (path, contents) ->
    fs.writeFileAsync(path, contents)

  getId: (data) ->
    pSemaphore.add =>
      @nextId(data)

  editFileMode: (bool, options = {}) ->
    _.defaults options, delay: false

    fn = =>
      @app.set("editFileMode", bool)

    if delay = options.delay
      _.delay(fn, delay)
    else
      fn()

  logErr: (e, filepath) ->
    gutil.beep()

    ## normalize the error, if its a NETCONNECT error
    ## then the actual error instance will be e.error
    e = if e instanceof Error then e else e.error

    Log.info "Error Generating Id", {error: e}

    console.log ""
    console.log "========================================"
    console.log gutil.colors.yellow("An error occured generating ids in file: "), gutil.colors.blue(filepath)
    console.log gutil.colors.red(e.message)
    console.error(e.stack)
    console.log "========================================"

  parseStackTrace: (trace) ->
    _.reduce trace, (memo, obj) ->
      str = " --> #{obj.file}: #{obj.line}"
      str += " (in function #{obj.function})" if obj.function
      memo.push str
      memo
    , []

  parseFileFromStackTrace: (trace, rootPath) ->
    return "Unknown file (could not read from stack trace)" if not trace.length

    trace[0].file.replace(rootPath, "")

  hasExistingId: (e) ->
    e.idFound

  idFound: ->
    e = new Error
    e.idFound = true
    throw e

  nextId: (data) ->
    @keys.nextKey().bind(@)
    .then((id) ->
      Log.info "Appending ID to Spec", {id: id, spec: data.spec, title: data.title}
      @appendTestId(data.spec, data.title, id)
      .return(id)
    )
    .catch (e) ->
      @logErr(e, data.spec)

      throw e

  appendTestId: (spec, title, id) ->
    normalizedPath = path.join(@projectRoot, spec)

    @read(normalizedPath).bind(@)
    .then (contents) ->
      @insertId(contents, title, id)
    .then (contents) ->
      ## enable editFileMode which prevents us from sending out test:changed events
      @editFileMode(true)

      ## write the new content back to the file
      @write(normalizedPath, contents)
    .then ->
      ## remove the editFileMode so we emit file changes again
      ## if we're still in edit file mode then wait 1 second and disable it
      ## chokidar doesnt instantly see file changes so we have to wait
      @editFileMode(false, {delay: 1000})
    .catch @hasExistingId, (err) ->
      ## do nothing when the ID is existing

  insertId: (contents, title, id) ->
    re = new RegExp "['\"](" + escapeRegExp(title) + ")['\"]"

    # ## if the string is found and it doesnt have an id
    matches = re.exec contents

    ## matches[1] will be the captured group which is the title
    return @idFound() if not matches

    ## position is the string index where we first find the capture
    ## group and include its length, so we insert right after it
    position = matches.index + matches[1].length + 1
    str.insert contents, position, " [#{id}]"

module.exports = IdGenerator