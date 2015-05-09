require("./environment")

global.config  = require("konfig")()
Settings       = require("./util/settings")
Server         = require("./server")
Updater        = require("./updater")
cache          = require("./cache")
Log            = require("./log")
child_process  = require("child_process")
open           = require('open')
fs             = require("fs-extra")
Promise        = require('bluebird')

class Booter
  constructor: (projectRoot) ->
    if not (@ instanceof Booter)
      return new Booter(projectRoot)

    if not projectRoot
      throw new Error("Instantiating bin/cy requires a projectRoot!")

    @projectRoot = projectRoot
    @child       = null

  createChildProcess: ->
    new Promise (resolve, reject) =>
      ## do not assign fork directly for testability
      ## setting execArgv so tests pass in
      ## node-inspector debug mode
      @child = child_process.fork(__filename, [@projectRoot], {execArgv: []})

      @child.on "message", (msg) ->
        console.log "received message: ", JSON.stringify(msg)

        if msg.done
          resolve(msg)

      @child.on "error", reject

  boot: (options = {}) ->
    ## if we're supposed to be forking dont boot the
    ## server and instead fork and create the child
    ## process to do the work for us
    return @createChildProcess() if options.fork

    # Promise.onPossiblyUnhandledRejection ->
    #   debugger
    # process.on "uncaughtException", (err) ->
    #   debugger
      # http.post "airbrake", err
      ## write to a log file

    send(projectRoot: @projectRoot)

    @server = Server(@projectRoot)

    @server.open().bind(@)
    .then (settings) ->
      {server: @server, settings: settings}

  close: ->
    @server.close()

  ## attach to Booter class
  @cache = cache

  ## attach to Booter class
  @Updater = Updater

  ## attach to Booter class
  @Log = Log

  ## attach to Booter class
  @manifest = fs.readJsonSync(process.cwd() + "/package.json")

send = (obj) ->
  if process.send
    process.send(obj)

isRunningFromCli = ->
  ## make sure we're not being loaded from a parent module
  ## and that we're inside of development env!
  (not module.parent) and (process.env["NODE_ENV"] is "development")

## are we a child process
## by verifying we have the cyFork
## env and we are not in debugger
## mode with node inspector
isChildProcess = ->
  !!(process.send and not process.execArgv.length)

## if we are a child process
## or if we are being run from the command
## line directly from node (like nodemon)
if isChildProcess() or isRunningFromCli()
  projectRoot = process.argv[2]

  ## boot the server and then send this
  ## to our parent process
  Booter(projectRoot).boot().then (obj) ->
    obj.settings.done = true

    if "id_generator" in process.argv
      open(obj.settings.idGeneratorUrl)

    send(obj.settings)

module.exports = Booter