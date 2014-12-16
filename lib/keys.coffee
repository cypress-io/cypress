_        = require 'lodash'
Promise  = require 'bluebird'
path     = require 'path'
fs       = Promise.promisifyAll(require('fs'))

class Keys
  ## Set up offline local id sync location
  _initOfflineSync: (keyCountLocation) ->
    fs.mkdirAsync(path.dirname(keyCountLocation))
    .then ->
      fs.writeFileAsync(keyCountLocation, '{"start":0,"end":99}', "utf8")


  ## Lookup the next Test integer and update
  ## offline location of sync
  _getNextTestNumber: (keyCountLocation) ->
    @_getOfflineContents(keyCountLocation)
    .then (range) =>
      next = range.start
      range.start++
      range.end += 100 if (range.start > range.end)

      @_updateOfflineContents(range, keyCountLocation)
      .then -> next

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
