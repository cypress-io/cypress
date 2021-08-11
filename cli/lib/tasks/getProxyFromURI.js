'use strict'

function formatHostname (hostname) {
  // canonicalize the hostname, so that 'oogle.com' won't match 'google.com'
  return hostname.replace(/^\.*/, '.').toLowerCase()
}

function parseNoProxyZone (zone) {
  zone = zone.trim().toLowerCase()

  let zoneParts = zone.split(':', 2)
  let zoneHost = formatHostname(zoneParts[0])
  let zonePort = zoneParts[1]
  let hasPort = zone.indexOf(':') > -1

  return { hostname: zoneHost, port: zonePort, hasPort }
}

function uriInNoProxy (uri, noProxy) {
  let port = uri.port || (uri.protocol === 'https:' ? '443' : '80')
  let hostname = formatHostname(uri.hostname)
  let noProxyList = noProxy.split(',')

  // iterate through the noProxyList until it finds a match.
  return noProxyList.map(parseNoProxyZone).some(function (noProxyZone) {
    let isMatchedAt = hostname.indexOf(noProxyZone.hostname)
    let hostnameMatched = (
      isMatchedAt > -1 &&
        (isMatchedAt === hostname.length - noProxyZone.hostname.length)
    )

    if (noProxyZone.hasPort) {
      return (port === noProxyZone.port) && hostnameMatched
    }

    return hostnameMatched
  })
}

function getProxyFromURI (uri) {
  // Decide the proper request proxy to use based on the request URI object and the
  // environmental variables (NO_PROXY, HTTP_PROXY, etc.)
  // respect NO_PROXY environment variables (see: https://lynx.invisible-island.net/lynx2.8.7/breakout/lynx_help/keystrokes/environments.html)

  let noProxy = process.env.NO_PROXY || process.env.no_proxy || ''

  // if the noProxy is a wildcard then return null

  if (noProxy === '*') {
    return null
  }

  // if the noProxy is not empty and the uri is found return null

  if (noProxy !== '' && uriInNoProxy(uri, noProxy)) {
    return null
  }

  // Check for HTTP or HTTPS Proxy in environment Else default to null

  if (uri.protocol === 'http:') {
    return process.env.HTTP_PROXY ||
      process.env.http_proxy ||
      process.env.npm_config_proxy || null
  }

  if (uri.protocol === 'https:') {
    return process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.npm_config_https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy ||
      process.env.npm_config_proxy || null
  }

  // if none of that works, return null
  // (What uri protocol are you using then?)

  return null
}

module.exports = getProxyFromURI
