const _ = require("lodash")
const fs = require('hexo-fs')
const path = require('path')
const request = require('request-promise')

const startsWithHttpRe = /^http/
const everythingAfterHashRe = /(#.+)/

function isExternalHref (str) {
  return startsWithHttpRe.test(str)
}

function stripHashes (str) {
  return str.replace(everythingAfterHashRe, '')
}

function extractHash (str) {
  const matches = everythingAfterHashRe.exec(str)

  return (matches && matches[0]) || ''
}

function validateExternalUrl (href) {
  return request(href)
  .promise()
  .return(href)
  .catch((err) => {
    err.message = `Request to: ${href} failed. (Status Code ${err.statusCode})`
    throw err
  })
}

function normalizeNestedPaths (data) {
  // takes the data, iterates through it
  // and modifies all of the values with a fully
  // qualified path to the html file

  function flatten (obj, memo, parents) {
    return _.reduce(obj, (memo, value, key) => {
      if (_.isObject(value)) {
        return flatten(value, memo, parents.concat(key))
      }

      memo[key] = parents.concat(value).join("/")

      return memo
    }, memo)
  }

  function expand (obj, parents) {
    return _.mapValues(obj, (value, key) => {
      if (_.isObject(value)) {
        return expand(value, parents.concat(key))
      }

      return parents.concat(value).join("/")
    })
  }

  // return
  return {
    expanded: expand(data, []),
    flattened: flatten(data, {}, []),
  }
}

function findFileBySource (sidebar, href) {
  const { expanded, flattened } = normalizeNestedPaths(sidebar)

  href = stripHashes(href)

  function property () {
    // drill into the original sidebar object
    return _.get(expanded, href.split('/'))
  }

  // find the path directly from the sidebar
  // if provided, or go search for it
  return flattened[href] || property()
}

function findUrlByFile (sidebar, href) {
  // get the resolve path to the file
  // cypress-101 -> guides/core-concepts/cypress-101.html
  const pathToFile = findFileBySource(sidebar, href)

  const hash = extractHash(href)

  if (pathToFile) {
    // ensure this physically exists on disk
    // inside of './source' folder
    return fs.stat(
      path.resolve('source', pathToFile.replace('.html', '.md'))
    )
    .return(`/${pathToFile}${hash}`)
  }

  throw new Error(`Could not find a valid doc file in the sidebar.yml for: ${href}`)
}

function validateAndGetUrl (sidebar, href) {
  if (isExternalHref(href)) {
    return validateExternalUrl(href)
  }

  return findUrlByFile(sidebar, href)
}

module.exports = {
  normalizeNestedPaths,

  findFileBySource,

  findUrlByFile,

  validateAndGetUrl,
}
