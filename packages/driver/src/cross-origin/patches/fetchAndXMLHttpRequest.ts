const captureFullRequestUrl = (relativeOrAbsoluteUrlString, window) => {
  // need to pass the window here by reference to generate the correct absolute URL if needed. Spec Bridge does NOT contain sub domain
  let url

  try {
    url = new URL(relativeOrAbsoluteUrlString).toString()
  } catch (err1) {
    try {
      // likely a relative path, construct the full url
      url = new URL(relativeOrAbsoluteUrlString, window.location.origin).toString()
    } catch (err2) {
      return undefined
    }
  }

  return url
}

export const patchXmlHttpRequest = (Cypress, window) => {
  // intercept method calls and add cypress headers to determine cookie applications in the proxy
  // for simulated top

  if (!Cypress.config('experimentalSessionAndOrigin')) {
    return
  }

  const originalXmlHttpRequestOpen = window.XMLHttpRequest.prototype.open
  const originalXmlHttpRequestSend = window.XMLHttpRequest.prototype.send

  window.XMLHttpRequest.prototype.open = function (...args) {
    try {
      // since the send method does NOT have access to the arguments passed into open or have the request information,
      // we need to store a reference here to what we need in the send method
      this._url = captureFullRequestUrl(args[1], window)
    } finally {
      return originalXmlHttpRequestOpen.apply(this, args)
    }
  }

  window.XMLHttpRequest.prototype.send = function (...args) {
    try {
      // if the option is specified, communicate it to the the server to the proxy can make the request aware if it needs to potentially apply cross origin cookies
      // if the option isn't set, we can imply the default as we know the resource type in the proxy
      if (this._url) {
        Cypress.backend('request:sent:with:credentials', {
          // TODO: might need to go off more information here or at least make collisions less likely
          url: this._url,
          resourceType: 'xhr',
          credentialStatus: this.withCredentials,
        })
      }
    } finally {
      // if our internal logic errors for whatever reason, do NOT block the end user and continue the request
      return originalXmlHttpRequestSend.apply(this, args)
    }
  }
}

export const patchFetch = (Cypress, window) => {
  // if fetch is available in the browser, or is polyfilled by whatwg fetch
  // intercept method calls and add cypress headers to determine cookie applications in the proxy
  // for simulated top. @see https://github.github.io/fetch/ for default options
  if (!Cypress.config('experimentalSessionAndOrigin') || !window.fetch) {
    return
  }

  const originalFetch = window.fetch

  window.fetch = function (...args) {
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
      } else if (Cypress._.isString(resource)) {
        url = captureFullRequestUrl(resource, window)

        ;({ credentials } = args[1] || {})
      }

      credentials = credentials || 'same-origin'
      // if the option is specified, communicate it to the the server to the proxy can make the request aware if it needs to potentially apply cross origin cookies
      // if the option isn't set, we can imply the default as we know the resource type in the proxy
      if (url) {
        Cypress.backend('request:sent:with:credentials', {
          // TODO: might need to go off more information here or at least make collisions less likely
          url,
          resourceType: 'fetch',
          credentialStatus: credentials,
        })
      }
    } finally {
      // if our internal logic errors for whatever reason, do NOT block the end user and continue the request
      return originalFetch.apply(this, args)
    }
  }
}
