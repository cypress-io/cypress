_               = require 'underscore'
_.str           = require 'underscore.string'
path            = require 'path'
gutil           = require 'gulp-util'
Promise         = require 'bluebird'
fs              = Promise.promisifyAll(require('fs'))
Keys            = require "./keys"
SecretSauce     = require "./util/secret_sauce_loader"
PSemaphore      = require 'promise-semaphore'
escapeRegExp    = require "./util/escape_regexp"

pSemaphore       = new PSemaphore()

class IdGenerator
  escapeRegExp: escapeRegExp

  constructor: (app) ->
    if not (@ instanceof IdGenerator)
      return new IdGenerator(app)

    if not app
      throw new Error("Instantiating lib/id_generator requires an app!")

    @app         = app
    @projectRoot = @app.get("cypress").projectRoot
    @keys        = Keys(@projectRoot)

  str: _.str

  path: path

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

SecretSauce.mixin("IdGenerator", IdGenerator)

module.exports = IdGenerator