/// <reference types="cypress" />
import React from 'react'
import * as M from './add'
import { mount } from 'cypress/react'
import * as Foo from './Foo'
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

  it('stubs lodash method from node_modules using static import', () => {
    cy.stub(_, 'camelCase').callsFake(() => 'STUB')
    expect(_.camelCase('aaaa')).to.eq('STUB')
  })
})
