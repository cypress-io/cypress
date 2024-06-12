import { captureFullRequestUrl, requestSentWithCredentials } from './utils'

export const patchFetch = (window) => {
  // if fetch is available in the browser, or is polyfilled by whatwg fetch
  // intercept method calls and add cypress headers to determine cookie applications in the proxy
  // for simulated top. @see https://github.github.io/fetch/ for default options
  if (!window.fetch) {
    return
  }

  const originalFetch = window.fetch

  window.fetch = async function (...args) {
    try {
      let url: string | undefined = undefined
      let credentials: string | undefined = undefined

      const resource = args[0]

      // @see https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters for fetch resource options. We will only support Request, URL, and strings
      if (resource instanceof window.Request) {
        ({ url, credentials } = resource)
      } else if (resource instanceof window.URL) {
        // should be a no-op for URL
        url = resource.toString()

        ;({ credentials } = args[1] || {})
      } else if (typeof resource === 'string') {
        url = captureFullRequestUrl(resource, window)

        ;({ credentials } = args[1] || {})
      }

      credentials = credentials || 'same-origin'
      // if the option is specified, communicate it to the the server to the proxy can make the request aware if it needs to potentially apply cross origin cookies
      // if the option isn't set, we can imply the default as we know the resourceType in the proxy
      await requestSentWithCredentials({
        url,
        resourceType: 'fetch',
        credentialStatus: credentials,
      })
    } finally {
      // if our internal logic errors for whatever reason, do NOT block the end user and continue the request
      return originalFetch.apply(this, args)
    }
  }
}
