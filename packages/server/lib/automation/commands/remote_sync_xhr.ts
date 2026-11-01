// The AUT shares the runner's thread, so a synchronous XHR blocks the driver from answering a
// cy.intercept route handler and the page deadlocks. Marking the request lets the proxy skip
// the handler for it. It runs in every frame below the runner's.
export const SYNC_XHR_PATCH = `(() => {
  if (window === window.top) return
  const open = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (...args) {
    const result = open.apply(this, args)
    if (args.length > 2 && !args[2]) {
      this.setRequestHeader('x-cypress-is-sync-request', 'true')
    }
    return result
  }
})()`
