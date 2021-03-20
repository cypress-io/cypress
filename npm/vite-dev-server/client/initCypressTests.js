// This file is merged in a <script type=module> into index.html
// it will be used to load and kick start the selected spec

const supportPath = '{{{supportFilePath}}}'
const originAutUrl = '{{{originAutUrl}}}'
const specPath = window.location.pathname.replace(originAutUrl, '')

/**
 * Init body with root node for test mounts
 *
 * @param {*} id
 * @param {*} tag
 * @param {*} parent
 * @returns
 */
function appendTargetIfNotExists (id, tag = 'div', parent = document.body) {
  const node = document.createElement(tag)

  node.setAttribute('id', id)
  parent.appendChild(node)

  return node
}

const importsToLoad = [() => {
  return import(specPath).catch((e) => {
  // FIXME: once https://github.com/vitejs/vite/issues/2525 is fixed,
  // no need to eat the compile errors anymore

    // if the import failed, it might be because of dependencies
    // so we try a quick refresh just in case it is

    // Since vite does not work with IE we can use URLSearchParams without polyfill
    const searchParams = new URLSearchParams(window.location.search)
    const r = searchParams.has('refresh') ? parseInt(searchParams.get('refresh'), 10) + 1 : 0

    // limit the number of refresh (dependency discovery depths)
    // to 2 instead of 1 for React-DOM
    if (r < 2) {
      searchParams.set('refresh', r)
      window.location.search = searchParams
    } else {
      throw new Error(`
      **Error during compilation.**
 Check the terminal log for more info
`, e)
    }
  })
}]

if (supportPath) {
  importsToLoad.unshift(() => import(supportPath))
}

const CypressInstance = window.Cypress = parent.Cypress

if (!CypressInstance) {
  throw new Error('Tests cannot run without a reference to Cypress!')
}

// In this variable, we save head
// innerHTML to account for loader installed styles
let headInnerHTML = ''

// before the run starts save
CypressInstance.on('run:start', () => {
  headInnerHTML = document.head.innerHTML
})

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
    Cypress.action('cy:viewport:changed', { viewportWidth: 1000, viewportHeight: 800 })

    return
  }

  // reset the viewport to default when in normal mode
  Cypress.action('cy:viewport:changed', { viewportWidth: Cypress.config('viewportWidth'), viewportHeight: Cypress.config('viewportHeight') })

  document.body.innerHTML = ''
  document.head.innerHTML = headInnerHTML
  appendTargetIfNotExists('__cy_root')
})

// Make usage of node test plugins possible
window.global = window
