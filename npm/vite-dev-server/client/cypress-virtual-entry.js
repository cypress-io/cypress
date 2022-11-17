/** @type {Cypress.Spec[]} */
const CYPRESS_SPECS = '__CYPRESS_SPECS__'
/** @type {Cypress.Spec[]} */
const CYPRESS_RUN_ALL_SPECS = '__CYPRESS_RUN_ALL_SPECS__'
/** @type {Cypress.Spec} */
const CYPRESS_SUPPORT_FILE = '__CYPRESS_SUPPORT_FILE__'

/** @type {Cypress.Cypress} */
const Cypress = window.Cypress = parent.Cypress

function init () {
  if (!Cypress) {
    throw new Error('Tests cannot run without a reference to Cypress!')
  }

  const devServerPublicPathRoute = Cypress.config('devServerPublicPathRoute')

  const importsToLoad = []

  if (CYPRESS_SUPPORT_FILE) {
    const { absolute, relative } = CYPRESS_SUPPORT_FILE

    importsToLoad.push({
      load: () => import(/* @vite-ignore */`${devServerPublicPathRoute}${relative}`),
      absolute,
      relative,
      relativeUrl: `${devServerPublicPathRoute}${relative}`,
    })
  }

  if (document.location.pathname.endsWith('__all')) {
    for (const spec of CYPRESS_RUN_ALL_SPECS) {
      importsToLoad.push({
        load: () => import(/* @vite-ignore */`${devServerPublicPathRoute}/${spec.relative}`),
        absolute: spec.absolute,
        relative: spec.relative,
        relativeUrl: `${devServerPublicPathRoute}/${spec.relative}`,
      })
    }
  } else {
    const specToLoad = CYPRESS_SPECS.find((spec) => document.location.pathname.includes(encodeURI(spec.absolute)))

    if (!specToLoad) {
      throw new Error('Could not find spec')
    }

    importsToLoad.push({
      load: () => import(/* @vite-ignore */`${devServerPublicPathRoute}/${specToLoad.relative}`),
      absolute: specToLoad.absolute,
      relative: specToLoad.relative,
      relativeUrl: `${devServerPublicPathRoute}/${specToLoad.relative}`,
    })
  }

  // load the support and spec
  Cypress.onSpecWindow(window, importsToLoad)

  // then start the test process
  Cypress.action('app:window:before:load', window)

  // Before all tests we are mounting the root element,
  // Cleaning up platform between tests is the responsibility of the specific adapter
  // because unmounting react/vue component should be done using specific framework API
  // (for devtools and to get rid of global event listeners from previous tests.)
  Cypress.on('test:before:run', () => {
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
  window.process = typeof process !== 'undefined' ? process : {}
}

init()
