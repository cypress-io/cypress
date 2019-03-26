import * as os from 'os'
import getWindowsProxy = require('@cypress/get-windows-proxy')

export function _getWindowsProxy () {
  return getWindowsProxy()
}

export function _normalizeEnvironmentProxy () {
  if (!process.env.HTTPS_PROXY) {
    // request library will use HTTP_PROXY as a fallback for HTTPS urls, but
    // proxy-from-env will not, so let's just force it to fall back like this
    process.env.HTTPS_PROXY = process.env.HTTP_PROXY
  }

  if (!process.env.NO_PROXY) {
    // don't proxy localhost, to match Chrome's default behavior and user expectation
    process.env.NO_PROXY = 'localhost'
  }
}

// @ts-ignore: Not all code paths return a value
export function loadSystemProxySettings () {
  if (process.env.HTTP_PROXY !== undefined) {
    _normalizeEnvironmentProxy()

    return
  }

  if (os.platform() === 'win32') {
    const windowsProxy = _getWindowsProxy()

    if (windowsProxy) {
      process.env.HTTP_PROXY = process.env.HTTPS_PROXY = windowsProxy.httpProxy
      process.env.NO_PROXY = process.env.NO_PROXY || windowsProxy.noProxy
    }

    _normalizeEnvironmentProxy()

    return 'win32'
  }
}
