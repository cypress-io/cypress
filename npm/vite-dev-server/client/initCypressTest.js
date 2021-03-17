const specPath = '{{{specPath}}}'
const supportPath = '{{{supportFilePath}}}'

function appendTargetIfNotExists (id, tag = 'div', parent = document.body) {
  let node = document.getElementById(id)

  if (!node) {
    node = document.createElement(tag)
    node.setAttribute('id', id)
    parent.appendChild(node)
  }

  node.innerHTML = ''

  return node
}

let importsToLoad = [() => {
  return import(specPath)
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

CypressInstance.onSpecWindow(window, importsToLoad)
CypressInstance.action('app:window:before:load', window)

// Before all tests we are mounting the root element, **not beforeEach**
// Cleaning up platform between tests is the responsibility of the specific adapter
// because unmounting react/vue component should be done using specific framework API
// (for devtools and to get rid of global event listeners from previous tests.)
CypressInstance.on('test:before:run', () => {
  // leave the error overlay alone if it exists
  if (document.body.querySelectorAll('vite-error-overlay').length) {
    return
  }

  document.body.innerHTML = ''
  document.head.innerHTML = headInnerHTML
  appendTargetIfNotExists('__cy_root')
})
