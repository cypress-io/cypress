import _ from 'lodash'
import Promise from 'bluebird'
import { basename, extname, sep } from 'path'

import $errUtils from '../../cypress/error_utils'

const NULL_SEP = '\u0000'

const clone = (obj) => {
  if (Buffer.isBuffer(obj)) {
    return Buffer.from(obj)
  }

  return JSON.parse(JSON.stringify(obj))
}

/**
 * Given a path, returns an array containing the path with and without its extension.
 * If there is no extension, returns an array containing only the original path.
 *
 * Used so invalidation can match both "foo.json" and "foo".
 *
 * @returns [pathWithExtension, pathWithoutExtension] if extension exists, otherwise [path].
 */
const withAndWithoutExt = (path: string) => {
  const extension = extname(path)

  return extension ? [path, path.slice(0, -extension.length)] : [path]
}

/**
 * Builds path prefixes that might have been used in a cache key's fixture
 * portion. Includes forward and backslash variants, with and without
 * extensions, and lowercase variants on Windows.
 */
const buildPrefixes = (rawPath: string): string[] => {
  const forward = rawPath.split(sep).join('/')
  const backslash = forward.replace(/\//g, '\\')

  const bases = [
    ...withAndWithoutExt(forward),
    ...withAndWithoutExt(backslash),
  ]

  if (Cypress.platform === 'win32') {
    bases.push(
      ...withAndWithoutExt(forward.toLowerCase()),
      ...withAndWithoutExt(backslash.toLowerCase()),
    )
  }

  return Array.from(new Set(bases))
}

/** Turn fixture path prefixes into matchable key prefixes. */
const makeKeyPrefixes = (fixturePath: string): string[] => {
  return buildPrefixes(fixturePath).map((prefix) => `${prefix}${NULL_SEP}`)
}

export default (Commands, Cypress, cy, state, config) => {
  // this is called at the beginning of run, so clear the cache
  let cache = {}

  const clearCache = () => {
    cache = {}
  }

  /**
   * Removes all cached fixture entries that correspond to the given path,
   * across all encodings.
   */
  const invalidateCacheEntry = (fixturePath: string) => {
    const prefixes = makeKeyPrefixes(fixturePath)

    for (const key of Object.keys(cache)) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        delete cache[key]
      }
    }
  }

  Cypress.on('clear:fixtures:cache', clearCache)
  Cypress.on('fixture:cache:invalidate', invalidateCacheEntry)

  return Commands.addAll({
    fixture (fixture, ...args) {
      if (config('fixturesFolder') === false) {
        $errUtils.throwErrByPath('fixture.set_to_false')
      }

      let options: Record<string, any> = {}

      if (_.isObject(args[0])) {
        options = args[0]
      } else if (_.isObject(args[1])) {
        options = args[1]
      }

      if (_.isString(args[0]) || args[0] === null) {
        options.encoding = args[0]
      }

      const cacheKey = `${fixture}${NULL_SEP}${options.encoding || ''}`
      const cachedContent = cache[cacheKey]

      if (cachedContent) {
        // Clone the cached content to prevent accidental mutation.
        return Promise.resolve(clone(cachedContent))
      }

      const timeout = options.timeout ?? Cypress.config('responseTimeout')

      // need to remove the current timeout
      // because we're handling timeouts ourselves
      cy.clearTimeout('get:fixture')

      return Cypress.backend('get:fixture', fixture, _.pick(options, 'encoding'))
      .timeout(timeout)
      .then((response) => {
        if (response && response.__error) {
          return $errUtils.throwErr(response.__error)
        }

        // https://github.com/cypress-io/cypress/issues/1558
        // We invoke Buffer.from() in order to transform this from an ArrayBuffer -
        // which socket.io uses to transfer the file over the websocket - into a
        // `Buffer`, which webpack polyfills in the browser.
        if (options.encoding === null) {
          response = Buffer.from(response)
        } else if (response instanceof ArrayBuffer) {
          // Cypress' behavior is to base64 encode binary files if the user
          // doesn't explicitly pass `null` as the encoding.
          response = Buffer.from(response).toString('base64')
        }

        // add the fixture to the cache
        // so it can just be returned next time
        cache[cacheKey] = response

        // Add the filename as a symbol, in case we need it later (such as when storing an alias)
        state('current').set('fileName', basename(fixture))

        // return the cloned response
        return clone(response)
      }).catch(Promise.TimeoutError, () => {
        return $errUtils.throwErrByPath('fixture.timed_out', {
          args: { timeout },
        })
      })
    },
  })
}
