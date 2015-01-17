_               = require 'underscore'
path            = require 'path'
gutil           = require 'gulp-util'
phantom         = require 'node-phantom-simple'
Promise         = require 'bluebird'
fs              = Promise.promisifyAll(require('fs'))
PSemaphore      = require('promise-semaphore')

pSemaphore       = new PSemaphore()

escapeRegExp = (str) ->
  str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

appendTestId = (spec, title, id) ->
  fs.readFileAsync(spec, "utf8")
  .then (contents) ->
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
    fs.writeFileAsync(spec, contents).then ->
      ## remove the editFileMode so we emit file changes again
      ## if we're still in edit file mode then wait 1 second and disable it
      ## chokidar doesnt instantly see file changes so we have to wait
      _.delay ->
        app.disable("editFileMode")
      , 1000

nextId = (data) ->
  keys = new (require('./keys'))

  keys.nextKey(app)
  .then((id) ->
    appendTestId(data.spec, data.title, id)
    .then(-> id)
  )
  .catch (e) ->
    gutil.beep()
    e.details = [gutil.colors.yellow("An error occured generating an ID for file: "), gutil.colors.blue(data.spec), gutil.colors.yellow(" for test: "), gutil.colors.blue(data.title)].concat(" ")
    e.details += ["\n " + gutil.colors.red(e.name), ": ", e.message].concat(" ")

    throw e

getId = (data) ->
  pSemaphore.add(nextId.bind(this, data))

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
  Promise.resolve()
  # createPhantom()
  # .then(createPhantomPage)
  # .then(visitIdPage)
  # , {parameters: "remote-debugger-port": "9000", "remote-debugger-autorun": "yes"}

module.exports =
  getId: getId
  openPhantom: openPhantom
