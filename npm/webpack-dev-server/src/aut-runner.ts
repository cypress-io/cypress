/* eslint-disable no-console */
/*eslint-env browser */

function appendTargetIfNotExists (id: string, tag = 'div', parent = document.body) {
  let node = document.getElementById(id)

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

  // Before all tests we are mounting the root element, **not beforeEach**
  // Cleaning up platform between tests is the responsibility of the specific adapter
  // because unmounting react/vue component should be done using specific framework API
  // (for devtools and to get rid of global event listeners from previous tests.)
  Cypress.on('test:before:run', () => {
    appendTargetIfNotExists('__cy_root')
  })

  return {
    restartRunner: Cypress.restartRunner,
  }
}
