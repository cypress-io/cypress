export const patchXmlHttpRequest = (window: Window) => {
  const originalXmlHttpRequestOpen = window.XMLHttpRequest.prototype.open

  window.XMLHttpRequest.prototype.open = function (...args) {
    const result = originalXmlHttpRequestOpen.apply(this, args)

    if (args.length > 2 && !args[2]) {
      this.setRequestHeader('x-cypress-is-sync-request', 'true')
    }

    return result
  }
}
