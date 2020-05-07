import _ from 'lodash'
import Debug from 'debug'
import { rewriteJsSourceMapAsync } from './async-rewriters'
import * as sourceMaps from './util/source-maps'
import url from 'url'

const debug = Debug('cypress:rewriter:deferred-source-map-cache')

export type DeferredSourceMapRequest = {
  uniqueId: string
  url: string
  js?: string
  sourceMap?: any
  resHeaders?: any
}

const caseInsensitiveGet = (obj, lowercaseProperty) => {
  for (let key of Object.keys(obj)) {
    if (key.toLowerCase() === lowercaseProperty) {
      return obj[key]
    }
  }
}

const getSourceMapHeader = (headers) => {
  // sourcemap has precedence
  // @see https://searchfox.org/mozilla-central/rev/dc4560dcaafd79375b9411fdbbaaebb0a59a93ac/devtools/shared/DevToolsUtils.js#611-619
  return caseInsensitiveGet(headers, 'sourcemap') || caseInsensitiveGet(headers, 'x-sourcemap')
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

  defer = (request: DeferredSourceMapRequest) => {
    if (this._getRequestById(request.uniqueId)) {
      // prevent duplicate uniqueIds from ever existing
      throw new Error(`Deferred sourcemap key "${request.uniqueId}" is not unique`)
    }

    // remove existing requests for this URL since they will not be loaded again
    this._removeRequestsByUrl(request.url)

    this.requests.push(request)
  }

  _removeRequestsByUrl (url: string) {
    _.remove(this.requests, { url })
  }

  _getRequestById (uniqueId: string) {
    return _.find(this.requests, { uniqueId })
  }

  async _getInputSourceMap (request: DeferredSourceMapRequest, headers: any) {
    // prefer inline sourceMappingURL over headers
    const sourceMapUrl = sourceMaps.getMappingUrl(request.js!) || getSourceMapHeader(request.resHeaders)

    if (!sourceMapUrl) {
      return
    }

    // try to decode it as a base64 string
    const inline = sourceMaps.tryDecodeInlineUrl(sourceMapUrl)

    if (inline) {
      return inline
    }

    // try to load it from the web
    const req = {
      url: url.resolve(request.url, sourceMapUrl),
      // TODO: this assumes that the sourcemap is on the same base domain, so it's safe to send the same headers
      // the browser sent for this sourcemap request - but if sourcemap is on a different domain, this will not
      // be true. need to use browser's cookiejar instead.
      headers,
      timeout: 5000,
    }

    try {
      const { body } = await this.requestLib(req, true)

      return body
    } catch (error) {
      // eslint-disable-next-line no-console
      debug('got an error loading user-provided sourcemap, serving proxy-generated sourcemap only %o', { url: request.url, headers, error })
    }
  }

  async resolve (uniqueId: string, headers: any) {
    const request = this._getRequestById(uniqueId)

    if (!request) {
      throw new Error(`Missing request with ID '${uniqueId}'`)
    }

    if (request.sourceMap) {
      return request.sourceMap
    }

    if (!request.js) {
      throw new Error('Missing JS for source map rewrite')
    }

    const inputSourceMap = await this._getInputSourceMap(request, headers)

    // cache the sourceMap so we don't need to regenerate it
    request.sourceMap = await rewriteJsSourceMapAsync(request.url, request.js, inputSourceMap)
    delete request.js // won't need this again
    delete request.resHeaders

    return request.sourceMap
  }
}
