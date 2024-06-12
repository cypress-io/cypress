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

const appendScripts = (specWindow, scripts) => {
  return Bluebird.each(scripts, (script: any) => {
    const firstScript = specWindow.document.querySelector('script')
    const specScript = specWindow.document.createElement('script')

    return new Promise<void>((resolve) => {
      specScript.addEventListener('load', () => {
        resolve()
      })

      specScript.src = script.relativeUrl
      firstScript.after(specScript)
    })
  })
}

interface Script {
  absolute: string
  relative: string
  relativeUrl: string
}

interface RunScriptsOptions {
  browser: Cypress.Browser
  scripts: Script[]
  specWindow: Window
  testingType: Cypress.TestingType
}

// Supports either scripts as objects or as async import functions
export default {
  runScripts: ({ browser, scripts, specWindow, testingType }: RunScriptsOptions) => {
    // if scripts contains at least one promise
    if (scripts.length && typeof scripts[0] === 'function') {
      // chain the loading promises
      // NOTE: since in evalScripts, scripts are evaluated in order,
      // we chose to respect this constraint here too.
      // indeed _.each goes through the array in order
      return Bluebird.each(scripts, (script: any) => script())
    }

    // in webkit, stack traces for e2e are made pretty much useless if these
    // scripts are eval'd, so we append them as script tags instead
    if (browser.family === 'webkit' && testingType === 'e2e') {
      return appendScripts(specWindow, scripts)
    }

    // for other browsers, we get the contents of the scripts so that we can
    // extract and utilize the source maps for better errors and code frames.
    // we then eval the script contents to run them
    return runScriptsFromUrls(specWindow, scripts)
  },
}
