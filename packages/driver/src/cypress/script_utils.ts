import Bluebird from 'bluebird'

import $networkUtils from './network_utils'
import $sourceMapUtils from './source_map_utils'

const fetchScript = (scriptWindow, script) => {
  return $networkUtils.fetch(script.relativeUrl, scriptWindow)
  .then((contents) => {
    return [script, contents]
  })
}

const extractSourceMap = ([script, contents]) => {
  script.fullyQualifiedUrl = `${window.top!.location.origin}${script.relativeUrl}`.replace(/ /g, '%20')

  const sourceMap = $sourceMapUtils.extractSourceMap(contents)

  return $sourceMapUtils.initializeSourceMapConsumer(script, sourceMap)
  .catch((_err) => {
    // if WebAssembly is missing, we can't consume source maps, but it shouldn't block Cy
    // like in WebKit on Windows: https://github.com/microsoft/playwright/issues/2876
  })
  .then(() => [script, contents])
}

const evalScripts = (specWindow, scripts: any = []) => {
  return Bluebird.each(scripts, (_script: any) => {
    const [script, contents] = _script

    if (script.load) {
      return script.load()
    }

    return specWindow.eval(`${contents}\n//# sourceURL=${script.fullyQualifiedUrl}`)
  })
}

const runScriptsFromUrls = (specWindow, scripts) => {
  return Bluebird
  .map<any, any>(scripts, (script) => fetchScript(specWindow, script))
  .map(extractSourceMap)
  .then((scripts) => evalScripts(specWindow, scripts))
}

// Supports either scripts as objects or as async import functions
export default {
  runScripts: (specWindow, scripts) => {
    // if scripts contains at least one promise
    if (scripts.length && typeof scripts[0] === 'function') {
      // chain the loading promises
      // NOTE: since in evalScripts, scripts are evaluated in order,
      // we chose to respect this constraint here too.
      // indeed _.each goes through the array in order
      return Bluebird.each(scripts, (script: any) => script())
    }

    return runScriptsFromUrls(specWindow, scripts)
  },
}
