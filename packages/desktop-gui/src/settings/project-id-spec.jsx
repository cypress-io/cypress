/// <reference types="cypress" />
import React from 'react'
import ProjectId from './project-id'
import { mount } from 'cypress-react-unit-test'

import ipc from '../lib/ipc'

/* global cy */
describe('ProjectId', () => {
  it('loads', () => {
    const project = {
      id: 'fake-project-id',
      configFile: false,
    }

    cy.stub(ipc, 'externalOpen').as('externalOpen')
    mount(<ProjectId project={project} />)
    cy.contains('a', 'Learn more').click()
    cy.get('@externalOpen').should('have.been.called')
  })
})
