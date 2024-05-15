// This file is merged in a <script type=module> into index.html
// it will be used to load and kick start the selected spec

const CypressInstance = window.Cypress = parent.Cypress

const importsToLoad = []

/* Support file import logic, this should be removed once we
 * are able to return relative paths from the supportFile
 * Jira #UNIFY-1260
 */
const supportFile = CypressInstance.config('supportFile')
const projectRoot = CypressInstance.config('projectRoot')
const devServerPublicPathRoute = CypressInstance.config('devServerPublicPathRoute')

if (supportFile) {
  let supportRelativeToProjectRoot = supportFile.replace(projectRoot, '')

  console.log('support before', supportRelativeToProjectRoot)
  if (CypressInstance.config('platform') === 'win32') {
    const platformProjectRoot = projectRoot.replaceAll('/', '\\')

    supportRelativeToProjectRoot = supportFile.replace(platformProjectRoot, '')
    console.log('support after', supportRelativeToProjectRoot)
  }

  console.log(devServerPublicPathRoute)
  console.log(supportRelativeToProjectRoot)

  supportRelativeToProjectRoot = supportRelativeToProjectRoot.replaceAll('\\', '/')
  console.log(supportRelativeToProjectRoot)
  // supportRelativeToProjectRoot = 'cypress\\support\\component.js'
  // console.log('support override', supportRelativeToProjectRoot)

  // We need a slash before /cypress/supportFile.js, this happens by default
  // with the current string replacement logic.

  let pathing = devServerPublicPathRoute

  if (devServerPublicPathRoute === '') {
    pathing = '.'
  }

  importsToLoad.push({
    load: () => import(`${pathing}${supportRelativeToProjectRoot}`),
    absolute: supportFile,
    relative: supportRelativeToProjectRoot,
    relativeUrl: `${pathing}${supportRelativeToProjectRoot}`,
  })
}

// Using relative path wouldn't allow to load tests outside Vite project root folder
// So we use the "@fs" bit to load the test file using its absolute path
// Normalize path to not include a leading slash (different on Win32 vs Unix)
const normalizedAbsolutePath = CypressInstance.spec.absolute.replace(/^\//, '')
const testFileAbsolutePathRoute = `${devServerPublicPathRoute}/@fs/${normalizedAbsolutePath}`

/* Spec file import logic */
// We need a slash before /src/my-spec.js, this does not happen by default.
importsToLoad.push({
  load: () => import(testFileAbsolutePathRoute),
  absolute: CypressInstance.spec.absolute,
  relative: CypressInstance.spec.relative,
  relativeUrl: testFileAbsolutePathRoute,
})

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
window.process = typeof process !== 'undefined' ? process : {}
