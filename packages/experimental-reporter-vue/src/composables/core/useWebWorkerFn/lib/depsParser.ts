/**
 *
 * Concatenates the dependencies into a comma separated string.
 * this string will then be passed as an argument to the "importScripts" function
 *
 * @param {Array.<String>}} deps array of string
 * @returns {String} a string composed by the concatenation of the array
 * elements "deps" and "importScripts".
 *
 * @example
 * depsParser(['demo1', 'demo2']) // return importScripts('demo1, demo2')
 */
const depsParser = (deps: string[]) => {
  if (deps.length === 0) return ''

  const depsString = deps.map(dep => `${dep}`).toString()
  return `importScripts('${depsString}')`
}

export default depsParser
