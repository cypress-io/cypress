const _ = require('lodash')
const Promise = require('bluebird')

const $networkUtils = require('./network_utils')
const $sourceMapUtils = require('./source_map_utils')

const fetchScript = (scriptWindow, script) => {
  return $networkUtils.fetch(script.relativeUrl, scriptWindow)
  .then((contents) => {
    return [script, contents]
  })
}

const extractSourceMap = ([script, contents]) => {
  script.fullyQualifiedUrl = `${window.top.location.origin}${script.relativeUrl}`

  const sourceMap = $sourceMapUtils.extractSourceMap(script, contents)

  return $sourceMapUtils.initializeSourceMapConsumer(script, sourceMap)
  .return([script, contents])
}

const evalScripts = (specWindow, scripts = []) => {
  _.each(scripts, ([script, contents]) => {
    specWindow.eval(`${contents}\n//# sourceURL=${script.fullyQualifiedUrl}`)
  })

  return null
}

const runScripts = (specWindow, scripts) => {
  return Promise
  .map(scripts, (script) => fetchScript(specWindow, script))
  .map(extractSourceMap)
  .then((scripts) => evalScripts(specWindow, scripts))
}

module.exports = {
  runScripts,
}
