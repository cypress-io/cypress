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
  try {
    script.fullyQualifiedUrl = `${window.top!.location.origin}${script.relativeUrl}`.replace(/ /g, '%20')
  } catch (error) {
    // in cy-in-cy tests, window.top may not be accessible due to cross-origin restrictions
    if (error.name !== 'SecurityError') {
      // re-throw any error that's not a cross-origin error
      throw error
    }
  }

  const sourceMap = $sourceMapUtils.extractSourceMap(contents)

  return $sourceMapUtils.initializeSourceMapConsumer(script, sourceMap)
  .catch((_err) => {
    // if WebAssembly is missing, we can't consume source maps, but it shouldn't block Cy
    // like in WebKit on Windows: https://github.com/microsoft/playwright/issues/2876
  })
  .then(() => [script, contents])
}
/**
    // if the dynamic import failed, we can't exactly reimport the script as the import result is cached
          // so we reload the retrigger all requests now that the dev server has restarted

          // however, we could get in a state where the dev server has been terminated and we are constantly reloading the page
          // to no end, causing an infinite loop. We need to find solutions to mitigate this
 */

const retryLoadScript = async (script, deferredPromise) => {
  debugger
  // window.location.reload()

  fetch(`${script.absolute}?v=${Date.now()}`).then((response) => {
    debugger

    return response.text()
  }).then((text) => {
    debugger

    return window.eval(text)
  }).catch((e) => {
    debugger
    throw e
  })

  return script.fn(`${script.absolute}?v=${Date.now()}`).then((value) => {
    // the script has been loaded successfully
    debugger

    deferredPromise.status = 'fulfilled'
    deferredPromise.resolver(value)
  }).catch((e) => {
    debugger
    // the retry has effectively timed out
    if (deferredPromise.status === 'rejected') {
      debugger

      return
    }

    if (e.message.includes('Failed to fetch dynamically imported module') && script.retryable) {
      debugger

      return retryLoadScript(script, deferredPromise)
    }

    deferredPromise.status = 'rejected'
    deferredPromise.rejector(e)
  })
}

const evalScripts = (specWindow, scripts: any = []) => {
  return Bluebird.each(scripts, (_script: any) => {
    const [script, contents] = _script

    if (script.load) {
      return script.load().catch((e) => {
        debugger
        if (e.message.includes('Failed to fetch dynamically imported module') && script.retryable) {
          let resolver
          let rejector

          // @ts-expect-error
          let deferredPromise: { promise: Promise<any>, resolver: (value: any) => void, rejector: (reason?: any) => void, status: 'fulfilled' | 'rejected' } = {}

          debugger
          deferredPromise.promise = new Promise((resolve, reject) => {
            deferredPromise.resolver = resolve
            deferredPromise.rejector = reject
          })

          debugger
          retryLoadScript(script, deferredPromise)

          setTimeout(() => {
            debugger
            deferredPromise.status = 'rejected'
            deferredPromise.rejector(e)
          }, 10000)

          return deferredPromise.promise
        }

        throw e
      })
    }

    return specWindow.eval(`${contents}\n//# sourceURL=${script.fullyQualifiedUrl}`)
  })
}

const runScriptsFromUrls = (specWindow, scripts, projectRoot, specRelativePath, specAbsolutePath) => {
  return Bluebird
  .map<any, any>(scripts, (script) => fetchScript(specWindow, script))
  .map(extractSourceMap)
  .then((scripts) => {
    $sourceMapUtils.setSourceMapProjectRoot(specRelativePath, specAbsolutePath, projectRoot)

    return evalScripts(specWindow, scripts)
  })
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
  projectRoot: string
  specRelativePath: string
  specAbsolutePath: string
}

// Supports either scripts as objects or as async import functions
export default {
  runScripts: ({ browser, scripts, specWindow, testingType, projectRoot, specRelativePath, specAbsolutePath }: RunScriptsOptions) => {
    // if scripts contains at least one promise
    if (scripts.length && typeof scripts[0] === 'function') {
      $sourceMapUtils.setSourceMapProjectRoot(specRelativePath, specAbsolutePath, projectRoot)

      // chain the loading promises
      // NOTE: since in evalScripts, scripts are evaluated in order,
      // we chose to respect this constraint here too.
      // indeed _.each goes through the array in order
      return Bluebird.each(scripts, (script: any) => script())
    }

    // in webkit, stack traces for e2e are made pretty much useless if these
    // scripts are eval'd, so we append them as script tags instead
    if (browser.family === 'webkit' && testingType === 'e2e') {
      $sourceMapUtils.setSourceMapProjectRoot(specRelativePath, specAbsolutePath, projectRoot)

      return appendScripts(specWindow, scripts)
    }

    // for other browsers, we get the contents of the scripts so that we can
    // extract and utilize the source maps for better errors and code frames.
    // we then eval the script contents to run them
    return runScriptsFromUrls(specWindow, scripts, projectRoot, specRelativePath, specAbsolutePath)
  },
}
