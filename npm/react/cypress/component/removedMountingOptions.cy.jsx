import React from 'react'
import { mount } from '@cypress/react'

describe('removed mounting options', () => {
  function Foo () {
    return (<div>foo</div>)
  }

  it('throws error when receiving removed mounting options', () => {
    for (const key of ['cssFile', 'cssFiles', 'style', 'styles', 'stylesheet', 'stylesheets']) {
      expect(() => mount(<Foo />, {
        [key]: `body { background: red; }`,
      })).to.throw(
        `The \`${key}\` mounting option is no longer supported.`,
      )
    }
  })

  it('throws with custom command', () => {
    Cypress.on('fail', (e) => {
      expect(e.message).to.contain('The `styles` mounting option is no longer supported.')

      return false
    })

    cy.mount(<Foo />, {
      styles: 'body { background: red; }',
    })
  })
})
