import _ from 'lodash'
import * as uri from '@packages/network/lib/uri'

export const hideKeys = (token?: string | number | boolean) => {
  if (!token) {
    return
  }

  if (typeof token !== 'string') {
    // maybe somehow we passes key=true?
    // https://github.com/cypress-io/cypress/issues/14571
    return
  }

  return [
    token.slice(0, 5),
    token.slice(-5),
  ].join('...')
}

interface ConfigUrl {
  port?: number
  baseUrl?: string
  clientRoute?: string
  reporterRoute?: string
  namespace?: string
  xhrRoute?: string
}

export function setUrls (obj: ConfigUrl) {
  obj = _.clone(obj)

  // TODO: rename this to be proxyServer
  const proxyUrl = `http://localhost:${obj.port}`

  const rootUrl = obj.baseUrl
    ? uri.origin(obj.baseUrl)
    : proxyUrl

  return {
    ...obj,
    proxyUrl,
    browserUrl: rootUrl + obj.clientRoute,
    reporterUrl: rootUrl + obj.reporterRoute,
    xhrUrl: `${obj.namespace}${obj.xhrRoute}`,
  }
}
