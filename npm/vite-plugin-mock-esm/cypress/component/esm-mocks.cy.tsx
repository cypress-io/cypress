/// <reference types="cypress" />
import React from 'react'
import * as M from './add'
import { mount } from 'cypress/react'
import * as Foo from './Foo'
import Diff from 'diff'
// Blows up
import _ from 'lodash'

describe('ESM Mock Plugin', () => {
  it('uses real implementation', () => {
    expect(M.add(1, 2)).to.eq(3)
  })

  it('mocks', () => {
    cy.stub(M, 'add').callsFake(function multiply (a: number, b: number) {
      return a * b
    })

    // Plot twist - add actually does multiplication!
    expect(M.add(1, 2)).to.eq(2)
  })

  it('uses real implementation again', () => {
    expect(M.add(1, 2)).to.eq(3)
  })

  it('mocks with alias', () => {
    const stub = cy.stub(M, 'add').as('add')

    expect(M.add(1, 2)).to.be.undefined

    cy.wrap(stub).should('have.been.called')
    cy.get('@add').should('have.been.called')
  })

  it('stubs react component', () => {
    cy.stub(Foo, 'Foo').callsFake(() => <h1>Stub Component</h1>)
    mount(<Foo.Foo msg='Hello world' />)
    cy.contains('Stub Component').should('exist')
    cy.contains('Hello world').should('not.exist')
  })

  it('stubs diff from node_modules', () => {
    cy.stub(Diff, 'diffChars').callsFake(() => 'FAKE')
    expect(Diff.diffChars('ab', 'ac')).to.eq('FAKE')
  })

  it('stubs lodash method from node_modules using dynamic import', () => {
    async function run () {
      const _ = await import('lodash')

      cy.stub(_, 'camelCase').callsFake((str: string) => str.toUpperCase())
      const result = _.camelCase('foo_bar')

      expect(result).to.eq('FOO_BAR')
    }

    cy.wrap(run())
  })

  // TODO: __cypressModule(...).then is not a function
  it.skip('stubs lodash method from node_modules using `then`', async () => {
    await import('lodash').then((mod) => {
      cy.stub(mod, 'camelCase').callsFake((str: string) => str.toUpperCase())
      const result = mod.camelCase('foo_bar')

      expect(result).to.eq('FOO_BAR')
    })
  })

  it('stubs lodash method from node_modules using static import', () => {
    cy.stub(_, 'camelCase').callsFake(() => 'STUB')
    expect(_.camelCase('aaaa')).to.eq('STUB')
  })

  // TODO: maximum stack trace exceeded when calling M.add
  it.skip('spies', () => {
    cy.spy(M, 'add').as('add')
    expect(M.add(2, 5)).to.eq(10)
    cy.get('@add').should('be.calledOnceWith', 2, 5)
  })
})
