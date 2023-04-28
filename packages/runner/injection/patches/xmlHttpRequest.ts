import { captureFullRequestUrl, requestSentWithCredentials } from './utils'

export const patchXmlHttpRequest = (window: Window) => {
  // intercept method calls and add cypress headers to determine cookie applications in the proxy
  // for simulated top

  const originalXmlHttpRequestOpen = window.XMLHttpRequest.prototype.open
  const originalXmlHttpRequestSend = window.XMLHttpRequest.prototype.send

  window.XMLHttpRequest.prototype.open = function (...args) {
    try {
      // since the send method does NOT have access to the arguments passed into open or have the request information,
      // we need to store a reference here to what we need in the send method
      this._url = captureFullRequestUrl(args[1], window)
    } finally {
      return originalXmlHttpRequestOpen.apply(this, args as any)
    }
  }

  window.XMLHttpRequest.prototype.send = async function (...args) {
    try {
      // if the option is specified, communicate it to the the server to the proxy can make the request aware if it needs to potentially apply cross origin cookies
      // if the option isn't set, we can imply the default as we know the "resourceType" in the proxy
      await requestSentWithCredentials({
        url: this._url,
        resourceType: 'xhr',
        credentialStatus: this.withCredentials,
      })
    } finally {
      // if our internal logic errors for whatever reason, do NOT block the end user and continue the request
      return originalXmlHttpRequestSend.apply(this, args)
    }
  }
}
