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

let devServerPublicPathBase = devServerPublicPathRoute

// In the case the devServerPublicPathRoute is set to the root, make sure we configure the loaders correctly to load relative paths
// This can be a case in vite 5 if a user wishes to have the same public path as their app (which is quite common)
if (devServerPublicPathRoute === '') {
  devServerPublicPathBase = '.'
}

if (supportFile) {
  let supportRelativeToProjectRoot = supportFile.replace(projectRoot, '')

  if (CypressInstance.config('platform') === 'win32') {
    const platformProjectRoot = projectRoot.replaceAll('/', '\\')

    supportRelativeToProjectRoot = supportFile.replace(platformProjectRoot, '')

    // Support relative path (as well as in some cases absolute path) lookup is done with unix style operators.
    supportRelativeToProjectRoot = supportRelativeToProjectRoot.replaceAll('\\', '/')
  }

  // We need a slash before /cypress/supportFile.js if the devServerPublicPathRoute is populated, this happens by default
  // with the current string replacement logic. Otherwise, we need to specify the relative path to look up if devServerPublicPathRoute
  // is not defined as it would be in the base directory

  const relativeUrl = `${devServerPublicPathBase}${supportRelativeToProjectRoot}`

  // Add retry logic for support file imports to handle intermittent failures
  // when Vite hasn't finished processing the module yet.
  //
  // Vite's optimizeDeps runs asynchronously in the background, and even though
  // the support file is added to optimizeDeps.entries for pre-bundling, there's
  // a race condition where the dynamic import may execute before Vite has finished
  // processing the module. Vite doesn't provide an API to wait for optimizeDeps
  // completion, so retry logic is the most practical solution.
  //
  // IMPORTANT: Failed module imports are cached in the browser's module map, so
  // retrying with the same URL will immediately reject with the cached error.
  // To work around this, we append a cache-busting query parameter on retry attempts.
  importsToLoad.push({
    load: async () => {
      const maxRetries = 3
      const initialRetryDelay = 50 // milliseconds - start with a short delay since Vite is usually fast
      let lastError

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Use cache-busting query parameter on retries to bypass cached failures
          // The first attempt uses the original URL, retries append ?_cypress_retry=<attempt>
          const importUrl = attempt === 0
            ? relativeUrl
            : `${relativeUrl}${relativeUrl.includes('?') ? '&' : '?'}_cypress_retry=${attempt}`

          return await import(importUrl)
        } catch (error) {
          lastError = error
          // Only retry on network/module loading errors, not syntax errors
          // Check both message and name properties for better error detection
          const errorMessage = error?.message || ''
          const errorName = error?.name || ''
          const isRetryableError = (
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('dynamically imported module') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('Load failed') ||
            errorName === 'TypeError' && errorMessage.includes('fetch')
          )

          if (!isRetryableError || attempt === maxRetries - 1) {
            throw error
          }

          // Wait before retrying with exponential backoff

          const delay = initialRetryDelay * Math.pow(2, attempt)

          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }

      throw lastError
    },
    absolute: supportFile,
    relative: supportRelativeToProjectRoot,
    relativeUrl,
  })
}

// Using relative path wouldn't allow to load tests outside Vite project root folder
// So we use the "@fs" bit to load the test file using its absolute path
// Normalize path to not include a leading slash (different on Win32 vs Unix)
const normalizedAbsolutePath = CypressInstance.spec.absolute.replace(/^\//, '')
const testFileAbsolutePathRoute = `${devServerPublicPathBase}/@fs/${normalizedAbsolutePath}`

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
