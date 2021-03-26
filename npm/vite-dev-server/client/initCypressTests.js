// This file is merged in a <script type=module> into index.html
// it will be used to load and kick start the selected spec

const supportPath = import.meta.env.__cypress_supportPath
const originAutUrl = import.meta.env.__cypress_originAutUrl

const specPath = window.location.pathname.replace(originAutUrl, '')

const importsToLoad = [() => import(/* @vite-ignore */ specPath)]

if (supportPath) {
  importsToLoad.unshift(() => import(/* @vite-ignore */ supportPath))
}

const CypressInstance = window.Cypress = parent.Cypress

if (!CypressInstance) {
  throw new Error('Tests cannot run without a reference to Cypress!')
}

// load the support and spec
CypressInstance.onSpecWindow(window, importsToLoad)

// then start the test process
CypressInstance.action('app:window:before:load', window)

// Before all tests we are mounting the root element,
// Cleaning up platform between tests is the responsibility of the specific adapter
// because unmounting react/vue component should be done using specific framework API
// (for devtools and to get rid of global event listeners from previous tests.)
CypressInstance.on('test:before:run', () => {
  // leave the error overlay alone if it exists
  if (document.body.querySelectorAll('vite-error-overlay').length) {
    // make the error more readable by giving it more space
    Cypress.action('cy:viewport:changed', { viewportWidth: 1000, viewportHeight: 500 })

    return
  }

  // reset the viewport to default when in normal mode
  Cypress.action('cy:viewport:changed', {
    viewportWidth: Cypress.config('viewportWidth'),
    viewportHeight: Cypress.config('viewportHeight'),
  })
})

// Make usage of node test plugins possible
window.global = window
