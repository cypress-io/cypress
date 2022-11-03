import React from 'react'
import { mount } from '@cypress/react'

describe('removed mounting options', () => {
  it('throws error when receiving removed mounting options', () => {
    function Foo () {
      return (<div>foo</div>)
    }

    for (const key of ['cssFile', 'cssFiles', 'style', 'styles', 'stylesheet', 'stylesheets']) {
      expect(() => mount(<Foo />, {
        [key]: `body { background: red; }`,
      })).to.throw(
        `The \`${key}\` mounting option is no longer supported. See https://on.cypress.io/migration-11-0-0-component-testing-updates to migrate.`,
      )
    }
  })
})
