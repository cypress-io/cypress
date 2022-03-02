// In the last version of nextjs, the caching mechanism is hard to remove.
// The cacheBust here allows us to disable it in open mode while keeping it in run mode.
// When user will add a new spec in edit mode, there won't be any cache.
function render (cacheBust: boolean) {
  require(`!!./loader.js!./browser.js${cacheBust ? `?${(new Date()).getTime()}` : ''}`)
}

render(!parent.Cypress.config('isTextTerminal'))
