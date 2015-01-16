_        = require 'lodash'
Promise  = require 'bluebird'
path     = require 'path'
Request  = require 'request-promise'
fs       = Promise.promisifyAll(require('fs'))
API_URL  = process.env.API_URL or 'localhost:1234'
Settings = require('./util/settings')

updateSettings = (settings) ->
  Settings.read()
  .then (obj) ->
    settings.eclectus = _.extend(obj.eclectus, settings.eclectus)
    settings
  .then (obj) ->
    fs.writeFileAsync("eclectus.json", JSON.stringify(obj, null, 2))
    .then -> obj.eclectus

class Keys
  ## Set up offline local id sync location
  _initOfflineSync: (keyCountLocation) ->
    fs.mkdirAsync(path.dirname(keyCountLocation))
    .then(@_getNewKeyRange)
    .then (range) ->
      fs.writeFileAsync(keyCountLocation, range, "utf8")

  _getProjectID: ->
    Settings.read()
    .then (settings) ->
      if (settings.eclectus.projectID)
        return settings.eclectus.projectID

      Request.post("http://#{API_URL}/projects")
      .then (attrs) ->
        updateSettings(eclectus: {projectID: JSON.parse(attrs).uuid})
      .then (settings) -> settings.projectID

  _getNewKeyRange: =>
    @_getProjectID()
    .then (projectID) ->
      Request.post("http://#{API_URL}/projects/#{projectID}/keys")

  ## Lookup the next Test integer and update
  ## offline location of sync
  _getNextTestNumber: (keyCountLocation) ->
    @_getOfflineContents(keyCountLocation)
    .then (range) =>
      range = JSON.parse(range) if typeof range is "string"
      next = range.start
      range.start++
      if (range.start is range.end)
        return @_getNewKeyRange()
      range
    .then (range) =>
      range = JSON.parse(range) if typeof range is "string"
      @_updateOfflineContents(range, keyCountLocation)
      .then -> range.start

  _convertToId: (index) ->
    ival = index.toString(36)
    ## 0 pad number to ensure three digits
    [0,0,0].slice(ival.length).join("")+ival

  _updateOfflineContents: (range, keyCountLocation) ->
    fs.writeFileAsync(
      keyCountLocation,
      JSON.stringify(range),
      "utf8"
    )

  _getOfflineContents: (keyCountLocation)->
    fs.readFileAsync(keyCountLocation, "utf8")
    .then(JSON.parse)

  _ensureOfflineCache: (keyCountLocation) ->
    fs.openAsync(keyCountLocation, 'r')
    .catch => @_initOfflineSync(keyCountLocation)

  nextKey: (app) ->
    testFolder       = app.get("eclectus").testFolder
    keyCountLocation = path.resolve(path.join(testFolder, '/.ecl/', 'key_count'))

    @_ensureOfflineCache(keyCountLocation)
    .then => @_getNextTestNumber(keyCountLocation)
    .then @_convertToId

module.exports = Keys
