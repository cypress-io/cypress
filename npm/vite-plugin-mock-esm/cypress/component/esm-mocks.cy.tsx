/// <reference types="cypress" />
import React from 'react'
import * as M from './add'
import { mount } from 'cypress/react'
import * as Foo from './Foo'
import Diff from 'diff'
// Blows up
// import _ from 'lodash'

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

  // TODO: maximum stack trace exceeded when calling M.add
  it.skip('spies', () => {
    cy.spy(M, 'add').as('add')

    expect(M.add(2, 5)).to.eq(10)

    cy.get('@add').should('be.calledOnceWith', 2, 5)
  })

  it('stubs react component', () => {
    cy.stub(Foo, 'Foo').callsFake(() => <h1>Stub Component</h1>)
    mount(<Foo.Foo msg='Hello world' />)
    cy.contains('Stub Component').should('exist')
    cy.contains('Hello world').should('not.exist')
  })

  it('stubs lodash from node_modules', () => {
    cy.stub(Diff, 'diffChars').callsFake(() => 'FAKE')
    expect(Diff.diffChars('ab', 'ac')).to.eq('FAKE')
  })
})
