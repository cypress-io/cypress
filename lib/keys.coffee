_        = require 'lodash'
Promise  = require 'bluebird'
path     = require 'path'
fs       = Promise.promisifyAll(require('fs'))

initKeyCount = (keyCountLocation) ->
  fs.mkdirAsync(path.dirname(keyCountLocation))
  .then ->
    fs.writeFileAsync(keyCountLocation, '{"start":0,"end":99}', "utf8")

extractNext = (keyCountLocation) ->
  fs.readFileAsync(keyCountLocation, "utf8")
  .then(JSON.parse)
  .then (range) ->
    next = range.start
    range.start++
    range.end += 100 if (range.start > range.end)

    fs.writeFileAsync(
      keyCountLocation,
      JSON.stringify(range),
      "utf8"
    )
    .then -> next

convertToId = (index) ->
  ival = index.toString(36)
  # 0 pad number to ensure three digits
  [0,0,0].slice(ival.length).join("")+ival

nextKey = (app) ->
  testFolder       = app.get("eclectus").testFolder
  keyCountLocation = path.resolve(path.join(testFolder, '/.ecl/', 'key_count'))

  fs.openAsync(keyCountLocation, 'r')
  .then ->
    extractNext(keyCountLocation)
  .catch ->
    initKeyCount(keyCountLocation)
    .then -> extractNext(keyCountLocation)
  .then convertToId

module.exports =
  nextKey: nextKey
