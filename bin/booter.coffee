open     = require('open');
Settings = require("../lib/util/settings");
Server   = require("../lib/server")
Promise = require('bluebird')

module.exports = (projectRoot) ->
  # Promise.onPossiblyUnhandledRejection ->
  #   debugger
  # process.on "uncaughtException", (err) ->
  #   debugger
    # http.post "airbrake", err
    ## write to a log file

  server = Server(projectRoot)

  server.open()
  .then (settings) ->
    {server: server, settings: settings}
  ## catch booter errors and bubble this
  ## up to the client that we couldnt start
  ## the server
  # .catch (e) ->
