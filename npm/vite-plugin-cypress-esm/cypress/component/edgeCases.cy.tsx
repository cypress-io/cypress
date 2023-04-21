/// <reference types="cypress" />

import React from 'react'
import { mount } from 'cypress/react'
import * as Mod from './fixtures/class'
import * as Foo from './fixtures/Foo'
import numbers from './fixtures/defaultExportArray'
import { App } from './fixtures/reactQuery'
import { letters } from './fixtures/namedExportArray'

describe('edge cases', () => {
  describe('class with constructor', () => {
    context('named export', () => {
      it('does not throw `Class constructor Foo cannot be invoked without "new"` error', () => {
        const foo = new Mod.Foo('lachlan')

        expect(foo.hollaAt).to.eq('lachlan')
      })
    })

    context('default export', () => {
      it('does not throw `Class constructor Foo cannot be invoked without "new"` error', () => {
        const baz = new Mod.default('lachlan')

        expect(baz.hollaAt).to.eq('BAZ!')
      })
    })
  })

  it('works with react class component', () => {
    mount(<Foo.BarClassComponent msg='Hello world' />)
    cy.contains('Hello world').should('exist')
  })

  it('works with react function component', () => {
    mount(<Foo.Foo msg='Hello world' />)
    cy.contains('Hello world').should('exist')
  })

  it('inheritance via classes', () => {
    expect(new Foo.Dog('bark').greet()).to.eq('bark')
  })

  /**
   * Errors with "caught TypeError: this.client.defaultMutationOptions is not a function"
   *
   * Code is a weird mess of babel and the "old style" of inheritance with prototypes.
   * // https://github.com/cypress-io/cypress/pull/26536#issuecomment-1515863749
   **/
  it('works with react-query', () => {
    mount(<App />)
  })

  it('works with array as default export', () => {
    expect(Array.isArray(numbers)).to.be.true
    expect(numbers).to.deep.eq([1, 2, 3])
  })

  it('works with array as named export', () => {
    expect(Array.isArray(letters)).to.be.true
    expect(letters).to.deep.eq(['a', 'b', 'c'])
  })
})
