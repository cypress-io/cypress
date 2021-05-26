import React from 'react'
import { mount } from '@cypress/react'
import Settings from './settings'
import '../main.scss'

/* global cy */
describe('Settings', () => {
  it('loads', () => {
    const project = {
      resolvedNodeVersion: '99.0.0',
    }

    mount(<Settings project={project} />)

    cy.contains('.settings-node', project.resolvedNodeVersion).should('be.visible')
  })
})
