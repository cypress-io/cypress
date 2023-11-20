/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import { HelloWorld } from './hello-world.jsx'

/* eslint-env mocha */
describe('HelloWorld component', () => {
  it('works', () => {
    mount(<HelloWorld />)
    cy.contains('Hello World!')
  })

  it('errors if passing alias', () => {
    expect(() => mount(<HelloWorld />, { alias: 'foo' })).to.throw(
      `passing \`alias\` to mounting options is no longer supported. Use mount(...).as('foo') instead.`,
    )
  })
})
