/* eslint-env mocha */
/** Initialize an empty document with root element */
function renderTestingPlatform() {
  const document = cy.state('document')
  const el = document.getElementById('cypress-jsdom')
  if (el) {
    while (el.hasChildNodes()) {
      el.removeChild(el.lastChild)
    }
    return
  }

  const rootNode = document.createElement('div')
  rootNode.setAttribute('id', 'cypress-jsdom')
  document.getElementsByTagName('body')[0].prepend(rootNode)

  return cy.get('#cypress-jsdom', { log: false })
}

beforeEach(() => {
  renderTestingPlatform()
})
