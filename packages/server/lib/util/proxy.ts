import _ from 'lodash'
import debugModule from 'debug'
import os from 'os'
import { getWindowsProxy } from './get-windows-proxy'

const debug = debugModule('cypress:server:util:proxy')

const falsyEnv = (v) => {
  return v === 'false' || v === '0' || !v
}

const copyLowercaseEnvToUppercase = (name: string) => {
  // uppercase environment variables are used throughout Cypress and dependencies
  // but users sometimes supply these vars as lowercase
  const lowerEnv = process.env[name.toLowerCase()]

  if (lowerEnv) {
    debug('overriding uppercase env var with lowercase %o', { name })
    process.env[name.toUpperCase()] = lowerEnv
  }
}

const normalizeEnvironmentProxy = () => {
  if (falsyEnv(process.env.HTTP_PROXY)) {
    debug('HTTP_PROXY is falsy, disabling HTTP_PROXY')
    delete process.env.HTTP_PROXY
  }

  if (!process.env.HTTPS_PROXY && process.env.HTTP_PROXY) {
    // request library will use HTTP_PROXY as a fallback for HTTPS urls, but
    // proxy-from-env will not, so let's just force it to fall back like this
    debug('setting HTTPS_PROXY to HTTP_PROXY since it does not exist')
    process.env.HTTPS_PROXY = process.env.HTTP_PROXY
  }

  if (!process.env.hasOwnProperty('NO_PROXY')) {
    // don't proxy localhost, to match Chrome's default behavior and user expectation
    debug('setting default NO_PROXY of ``')
    process.env.NO_PROXY = ''
  }

  const noProxyParts = _.compact((process.env.NO_PROXY || '').split(','))

  if (!noProxyParts.includes('<-loopback>')) {
    debug('<-loopback> not found, adding localhost to NO_PROXY')
    process.env.NO_PROXY = noProxyParts.concat([
      '127.0.0.1', '::1', 'localhost',
    ]).join(',')
  }

  debug('normalized proxy environment variables %o', _.pick(process.env, [
    'NO_PROXY', 'HTTP_PROXY', 'HTTPS_PROXY',
  ]))
}

const mergeNpmProxyVars = () => {
  // copy npm's `proxy` and `https-proxy` config if they are set
  // https://github.com/cypress-io/cypress/pull/4705
  [
    ['npm_config_proxy', 'HTTP_PROXY'],
    ['npm_config_https_proxy', 'HTTPS_PROXY'],
  ].forEach(([from, to]) => {
    if (!falsyEnv(process.env[from]) && _.isUndefined(process.env[to])) {
      debug('using npm\'s %s as %s', from, to)
      process.env[to] = process.env[from]
    }
  })
}

export const loadSystemProxySettings = () => {
  debug('found proxy environment variables %o', _.pick(process.env, [
    'NO_PROXY', 'HTTP_PROXY', 'HTTPS_PROXY',
    'no_proxy', 'http_proxy', 'https_proxy',
    'npm_config_proxy', 'npm_config_https_proxy', 'npm_config_noproxy',
  ]))

  ;['NO_PROXY', 'HTTP_PROXY', 'HTTPS_PROXY'].forEach(copyLowercaseEnvToUppercase)

  mergeNpmProxyVars()

  if (!_.isUndefined(process.env.HTTP_PROXY)) {
    normalizeEnvironmentProxy()

    return
  }

  if (os.platform() !== 'win32') {
    return
  }

  const windowsProxy = getWindowsProxy()

  if (windowsProxy) {
    process.env.HTTP_PROXY = process.env.HTTPS_PROXY = windowsProxy.httpProxy
    process.env.NO_PROXY = process.env.NO_PROXY || windowsProxy.noProxy
  }

  normalizeEnvironmentProxy()

  return 'win32'
}
