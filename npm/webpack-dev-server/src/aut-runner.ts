/* eslint-disable no-console */
/*eslint-env browser */

function removeAllChildrenButId (id: string) {
  Array.from(document.body.children).forEach((child) => {
    if (child.id !== id) {
      document.body.removeChild(child)
    }
  })
}

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

  // In this variable, we save head
  // innerHTML to account for loader installed styles
  let headInnerHTML = ''

  // before the run starts save
  Cypress.on('run:start', () => {
    headInnerHTML = document.head.innerHTML

    // Before every test we mount the root element and teardown the rest,
    // Cleaning up platform between tests is the responsibility of the specific adapter
    // because unmounting react/vue component should be done using specific framework API
    // (for devtools and to get rid of global event listeners from previous tests.)
    if (!(window as any).Cypress_WebpackTeardownHooked) {
      // set this teardown last to allow for framework to have their own teardown
      Cypress.on('test:before:run', () => {
        document.head.innerHTML = headInnerHTML
        removeAllChildrenButId('__cy_root')
        appendTargetIfNotExists('__cy_root')
      });

      (window as any).Cypress_WebpackTeardownHooked = true
    }
  })

  return {
    restartRunner: Cypress.restartRunner,
  }
}
