/// <reference types="cypress" />
/// <reference types="../../lib" />

import React from 'react'
import ReactDom from 'react-dom'
import { mount } from '@cypress/react'
import CounterWithHooks from './counter-with-hooks.jsx'

describe('CounterWithHooks component', function () {
  it('works', function () {
    mount(<CounterWithHooks initialCount={3} />, { React, ReactDom })
    cy.contains('3')
  })

  it('counts clicks 2', () => {
    mount(<CounterWithHooks initialCount={0} />, { React, ReactDom })
    cy.contains('0')
    cy.get('#increment').click()
    cy.contains('1')
    cy.get('#increment').click()
    cy.contains('2')
  })
})
