/// <reference types="@percy/cypress" />

import React from 'react'
import { mount } from '@cypress/react'
import ScriptError from '../../src/errors/script-error'

describe('ScriptError', () => {
  it('renders an error', () => {
    const error = 'There is an error in your code.'

    mount(<ScriptError error={error} />).get('pre').contains(error)
    cy.percySnapshot()
  })
})
