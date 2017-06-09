const _ = require('lodash')
const fs = require('hexo-fs')
const url = require('url')
const path = require('path')
const cheerio = require('cheerio')
const Promise = require('bluebird')
const request = require('request-promise')
const errors = require('request-promise/errors')

const startsWithHttpRe = /^http/
const everythingAfterHashRe = /(#.+)/

function isExternalHref (str) {
  return startsWithHttpRe.test(str)
}

function stripHash (str) {
  return str.replace(everythingAfterHashRe, '')
}

function extractHash (str) {
  const matches = everythingAfterHashRe.exec(str)

  // return the hash match or empty string
  return (matches && matches[0]) || ''
}

function assertHashIsPresent (descriptor, source, hash, html) {
  // verify that the hash is present on this page
  const $ = cheerio.load(html)

  // hash starts with a '#'
  if (!$(hash).length) {
    const truncated = _.truncate(html, { length: 200 }) || '""'

    // if we dont have a hash
    throw new Error(`Constructing {% url %} tag helper failed

    > The source file was: ${source}

    > You referenced a hash that does not exist at: ${descriptor}

    > Expected to find an element matching the id: ${hash}

    > The HTML response body was:

    ${truncated}
    `)
  }
}

function validateExternalUrl (href, source) {
  const { hash } = url.parse(href)

  return request(href)
  .then((html) => {
    // bail if we dont have a hash
    if (!hash) {
      return
    }

    assertHashIsPresent(href, source, hash, html)
  })
  .catch(errors.StatusCodeError, (err) => {
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

  href = stripHash(href)

  function property () {
    // drill into the original sidebar object
    return _.get(expanded, href.split('/'))
  }

  // find the path directly from the sidebar
  // if provided, or go search for it
  return flattened[href] || property()
}

function getLocalFile (sidebar, href) {
  // get the resolve path to the file
  // cypress-101 -> guides/core-concepts/cypress-101.html
  const pathToFile = findFileBySource(sidebar, href)

  if (pathToFile) {
    // ensure this physically exists on disk
    // inside of './source' folder
    return fs.readFile(
      path.resolve('source', pathToFile.replace('.html', '.md'))
    ).then((str) => {
      // return an array with
      // path to file, and str bytes
      return [pathToFile, str]
    })
  }

  return Promise.reject(
    new Error(`Could not find a valid doc file in the sidebar.yml for: ${href}`)
  )
}

function validateLocalFile (sidebar, href, source, render) {
  const hash = extractHash(href)

  return getLocalFile(sidebar, stripHash(href))
  .spread((pathToFile, str) => {
    if (hash) {
      // if we have a hash then render
      // the markdown contents so we can
      // ensure it has the hash present!
      return render(str)
      .then((html) => {
        assertHashIsPresent(pathToFile, source, hash, html)

        return pathToFile
      })
    }

    return pathToFile
  })
  .then((pathToFile) => {
    return `/${pathToFile}${hash}`
  })
}

function validateAndGetUrl (sidebar, href, source, render) {
  if (isExternalHref(href)) {
    return validateExternalUrl(href, source)
    .return(href)
  }

  return validateLocalFile(sidebar, href, source, render)
}

module.exports = {
  normalizeNestedPaths,

  findFileBySource,

  getLocalFile,

  validateLocalFile,

  validateAndGetUrl,
}
