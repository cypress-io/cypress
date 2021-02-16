/* eslint-env mocha */

let headInnerHTML = document.head.innerHTML

/** Initialize an empty document with root element */
function renderTestingPlatform () {
  const document = cy.state('document')

  if (document.body) document.body.innerHTML = ''

  if (document.head) document.head.innerHTML = headInnerHTML

  const rootNode = document.createElement('div')

  rootNode.setAttribute('id', 'cypress-jsdom')
  document.getElementsByTagName('body')[0].prepend(rootNode)

  return cy.get('#cypress-jsdom', { log: false })
}

beforeEach(() => {
  renderTestingPlatform()
})

before(() => {
  // after the root imports are done
  const document = cy.state('document')

  headInnerHTML = document.head && document.head.innerHTML
})
