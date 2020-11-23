import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Settings from './settings'

/* global cy */
describe('Settings', () => {
  it('loads', () => {
    const project = {
      resolvedNodeVersion: '99.0.0',
    }

    mount(<Settings project={project} />, {
      stylesheets: '/__root/dist/app.css',
    })

    cy.contains('.settings-node', project.resolvedNodeVersion).should('be.visible')
  })
})
