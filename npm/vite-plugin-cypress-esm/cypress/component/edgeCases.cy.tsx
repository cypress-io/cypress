/// <reference types="cypress" />

import React from 'react'
import { mount } from 'cypress/react'
import * as Mod from './fixtures/class'
import * as Foo from './fixtures/Foo'

describe('edge cases', () => {
  it('class with constructor does not throw `Class constructor Foo cannot be invoked without "new"` error', () => {
    const foo = new Mod.Foo('lachlan')

    expect(foo.name).to.eq('lachlan')
  })

  it('works with react class component', () => {
    mount(<Foo.BarClassComponent msg='Hello world' />)
    cy.contains('Hello world').should('exist')
  })

  it('works with react function component', () => {
    mount(<Foo.Foo msg='Hello world' />)
    cy.contains('Hello world').should('exist')
  })
})
