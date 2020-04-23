import _ from 'lodash'
import Debug from 'debug'
import { rewriteJsSourceMapAsync } from './async-rewriters'
import * as sourceMaps from './util/source-maps'

const debug = Debug('cypress:rewriter:deferred-source-map-cache')

export type DeferredSourceMapRequest = {
  uniqueId: string
  url: string
  js: string
}

/**
 * Holds on to data necessary to rewrite user JS to maybe generate a sourcemap at a later time,
 * potentially composed with the user's own sourcemap if one is present.
 *
 * The purpose of this is to avoid wasting CPU time and network I/O on generating, composing, and
 * sending a sourcemap along with every single rewritten JS snippet, since the source maps are
 * going to be unused and discarded most of the time.
 */
export class DeferredSourceMapCache {
  _idCounter = 0
  requests: DeferredSourceMapRequest[] = []
  requestLib: any

  constructor (requestLib) {
    this.requestLib = requestLib
  }

  reset () {
    this.requests = []
  }

  defer = (request: DeferredSourceMapRequest): string => {
    debug('caching request %o', request)

    if (this._getRequestById(request.uniqueId)) {
      throw new Error(`Deferred sourcemap key "${request.uniqueId}" is not unique. This should never happen.`)
    }

    this.requests.push(request)

    return request.uniqueId
  }

  _getRequestById (uniqueId: string) {
    return _.find(this.requests, { uniqueId })
  }

  async resolve (uniqueId: string, headers: any) {
    const request = this._getRequestById(uniqueId)

    if (!request) {
      return
    }

    const sourceMapUrl = sourceMaps.getMappingUrl(request.js)

    let inputSourceMap

    if (sourceMapUrl) {
      inputSourceMap = sourceMaps.tryDecodeInlineUrl(sourceMapUrl)

      if (!inputSourceMap) {
        try {
          const { body } = await this.requestLib({
            url: request.url,
            headers,
          }, true)

          inputSourceMap = body
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error)
        }
      }
    }

    // TODO: swap out the cached js for the genned source map
    return rewriteJsSourceMapAsync(request.url, request.js, inputSourceMap)
  }
}
