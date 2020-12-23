/*eslint-env browser,mocha*/

function appendTargetIfNotExists (id: string, tag = 'div', parent = document.body) {
  let node = document.getElementById(id)

  if (!node) {
    node = document.createElement(tag)
    node.setAttribute('id', id)
    parent.appendChild(node)
  }

  node.innerHTML = ''

  return node
}

export function init (importPromises, parent = (window.opener || window.parent)) {
  const Cypress = (window as any).Cypress = parent.Cypress

  if (!Cypress) {
    throw new Error('Tests cannot run without a reference to Cypress!')
  }

  Cypress.onSpecWindow(window, importPromises)

  beforeEach(() => {
    const root = appendTargetIfNotExists('__cy_root')

    root.appendChild(appendTargetIfNotExists('__cy_app'))
  })

  return {
    restartRunner: Cypress.restartRunner,
  }
}
