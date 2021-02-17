/* eslint-env mocha */

const { renderTestingPlatform } = require('./renderTestingPlatform')

let headInnerHTML = document.head.innerHTML

beforeEach(() => {
  renderTestingPlatform(headInnerHTML)
})

before(() => {
  // after the root imports are done
  const document = cy.state('document')

  headInnerHTML = document.head && document.head.innerHTML
})
