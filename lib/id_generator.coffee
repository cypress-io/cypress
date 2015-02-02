_               = require 'underscore'
_.str           = require 'underscore.string'
path            = require 'path'
gutil           = require 'gulp-util'
Promise         = require 'bluebird'
fs              = Promise.promisifyAll(require('fs'))
Keys            = require("./keys")
PSemaphore      = require('promise-semaphore')

pSemaphore       = new PSemaphore()

hasExistingId = (e) ->
  e.idFound

idFound = ->
  e = new Error
  e.idFound = true
  throw e

class IdGenerator
  constructor: (app) ->
    if not (@ instanceof IdGenerator)
      return new IdGenerator(app)

    if not app
      throw new Error("Instantiating lib/id_generator requires an app!")

    @app         = app
    @projectRoot = @app.get("cypress").projectRoot
    @keys        = Keys(@projectRoot)

  escapeRegExp: (str) ->
    str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

  read: (path) ->
    fs.readFileAsync(path, "utf8")

  appendTestId: (spec, title, id) ->
    normalizedPath = path.join(@projectRoot, spec)

    @read(normalizedPath).bind(@)
    .then (contents) ->
      @insertId(contents, title, id)
    .then (contents) ->
      ## enable editFileMode which prevents us from sending out test:changed events
      @app.enable("editFileMode")

      ## write the new content back to the file
      @write(normalizedPath, contents)
    .then ->
      ## remove the editFileMode so we emit file changes again
      ## if we're still in edit file mode then wait 1 second and disable it
      ## chokidar doesnt instantly see file changes so we have to wait
      _.delay =>
        @app.disable("editFileMode")
      , 1000
    .catch hasExistingId, (err) ->
      ## do nothing when the ID is existing

  insertId: (contents, title, id) ->
    re = new RegExp "['\"](" + @escapeRegExp(title) + ")['\"]"

    # ## if the string is found and it doesnt have an id
    matches = re.exec contents

    ## matches[1] will be the captured group which is the title
    return idFound() if not matches

    ## position is the string index where we first find the capture
    ## group and include its length, so we insert right after it
    position = matches.index + matches[1].length + 1
    _.str.insert contents, position, " [#{id}]"

  write: (path, contents) ->
    fs.writeFileAsync(path, contents)

  getId: (data) ->
    pSemaphore.add =>
      @nextId(data)

  nextId: (data) ->
    @keys.nextKey().bind(@)
    .then((id) ->
      @appendTestId(data.spec, data.title, id)
      .return(id)
    )
    .catch (e) ->
      gutil.beep()
      @logErr(e, data.spec)
      # e.details = [gutil.colors.yellow("An error occured generating an ID for file: "), gutil.colors.blue(data.spec), gutil.colors.yellow(" for test: "), gutil.colors.blue(data.title)].concat(" ")
      # e.details += ["\n " + gutil.colors.red(e.name), ": ", e.message].concat(" ")

      throw e

  logErr: (e, filepath) ->
    ## normalize the error, if its a NETCONNECT error
    ## then the actual error instance will be e.error
    e = if e instanceof Error then e else e.error

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

  # createPhantom: ->
  #   new Promise (resolve, reject) ->
  #     phantom.create (err, ph) ->
  #       console.log "PhantomJS ready..."

  #       return reject(err) if err

  #       resolve(ph)

  # createPhantomPage = (ph) ->
  #   new Promise (resolve, reject) ->
  #     ph.createPage (err, page) ->
  #       return reject(err) if err

  #       resolve(page)

  # visitIdPage = (page) ->
  #   new Promise (resolve, reject) ->
  #     t = Date.now()
  #     rootPath = "http://localhost:#{app.get('port')}/"
  #     pathToPage = rootPath + "id_generator"
  #     console.log "PhantomJS opened: ", pathToPage

  #     # page.onConsoleMessage = (msg, lineNum, sourceId) ->
  #     #   debugger

  #     page.onError = (msg, trace) ->
  #       gutil.beep()
  #       stack = parseStackTrace(trace)
  #       file = parseFileFromStackTrace(trace, rootPath)

  #       ## need to convert this into a function so we can automatically
  #       ## log out the total length of the errors and generate the bar wrappers
  #       ## around them
  #       console.log ""
  #       console.log "========================================"
  #       console.log gutil.colors.yellow("An error occured generating ids in file: "), gutil.colors.blue(file)
  #       console.log gutil.colors.red(msg)
  #       console.log(stack.join("\n")) if stack.length
  #       console.log "========================================"

  #     page.open pathToPage, (err, status) ->
  #       return reject(err) if err
  #       console.log "PhantomJS done! status: #{status}, time: #{Date.now() - t}"
  #       resolve()

  # openPhantom = ->
    # Promise.resolve()
    # createPhantom()
    # .then(createPhantomPage)
    # .then(visitIdPage)
    # , {parameters: "remote-debugger-port": "9000", "remote-debugger-autorun": "yes"}

module.exports = IdGenerator
# module.exports =
  # getId: getId
  # openPhantom: openPhantom
