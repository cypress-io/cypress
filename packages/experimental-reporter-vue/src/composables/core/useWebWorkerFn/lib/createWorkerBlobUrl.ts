import jobRunner from './jobRunner'
import depsParser from './depsParser'

/**
 * Converts the "fn" function into the syntax needed to be executed within a web worker
 *
 * @param {Function} fn the function to run with web worker
 * @param {Array.<String>} deps array of strings, imported into the worker through "importScripts"
 *
 * @returns {String} a blob url, containing the code of "fn" as a string
 *
 * @example
 * createWorkerBlobUrl((a,b) => a+b, [])
 * // return "onmessage=return Promise.resolve((a,b) => a + b)
 * .then(postMessage(['SUCCESS', result]))
 * .catch(postMessage(['ERROR', error])"
 */
const createWorkerBlobUrl = (fn: Function, deps: string[]) => {
  const blobCode = `${depsParser(deps)}; onmessage=(${jobRunner})(${fn})`
  const blob = new Blob([blobCode], { type: 'text/javascript' })
  const url = URL.createObjectURL(blob)
  return url
}

export default createWorkerBlobUrl
