/*eslint-env browser,mocha*/

function appendTargetIfNotExists (id: string, tag = 'div', parent = document.body) {
  let node = document.getElementById(id)

  if (node) {
    // it is required to completely remove node from the document
    // cause framework can store the information between renders inside the root node (like react-dom is doing)
    node.parentElement.removeChild(node)
  }

  node = document.createElement(tag)
  node.setAttribute('id', id)
  parent.appendChild(node)

  return node
}

export function init (importPromises, parent = (window.opener || window.parent)) {
  const Cypress = (window as any).Cypress = parent.Cypress

  if (!Cypress) {
    throw new Error('Tests cannot run without a reference to Cypress!')
  }

  Cypress.onSpecWindow(window, importPromises)
  Cypress.action('app:window:before:load', window)

  beforeEach(() => {
    // This really have no sense for @cypress/react and @cypress/vue
    // It is anyway required to mount a new
    appendTargetIfNotExists('__cy_root')
  })

  return {
    restartRunner: Cypress.restartRunner,
  }
}
