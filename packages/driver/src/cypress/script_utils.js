const _ = require('lodash')
const Bluebird = require('bluebird')
// const debug = require('debug')('cypress:driver:script_utils')

const debug = function () {
  // eslint-disable-next-line no-console
  console.log('[cypress:driver:script_utils]', ...arguments)
}

const $networkUtils = require('./network_utils')
const $sourceMapUtils = require('./source_map_utils')

const fetchScript = (scriptWindow, script) => {
  return $networkUtils.fetch(script.relativeUrl, scriptWindow)
  .then((contents) => {
    return [script, contents]
  })
}

const extractSourceMap = ([script, contents]) => {
  script.fullyQualifiedUrl = `${window.top.location.origin}${script.relativeUrl}`.replace(/ /g, '%20')

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

const runScriptsFromUrls = (specWindow, scripts) => {
  return Bluebird
  .map(scripts, (script) => fetchScript(specWindow, script))
  .map(extractSourceMap)
  .then((scripts) => evalScripts(specWindow, scripts))
}

// Supports either scripts as objects or as async import functions
const runScripts = (specWindow, scripts) => {
  // if scripts contains at least one promise
  if (scripts.length && typeof scripts[0] === 'function') {
    // chain the loading promises
    // NOTE: since in evalScripts, scripts are evaluated in order,
    // we chose to respect this constraint here too.
    // indeed _.each goes through the array in order
    debug('scripts are promises')

    return Bluebird.each(scripts, (script, i) => {
      debug(`script ${i} running`)

      return new Bluebird((resolve) => {
        return script().then(() => {
          debug(`script ${i} done`)
          resolve()
        })
      })
    })
  }

  debug('scripts are files', scripts)

  return runScriptsFromUrls(specWindow, scripts)
}

module.exports = {
  runScripts,
}
