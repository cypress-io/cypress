/// <reference types="cypress" />
import React from 'react'
import ProjectId from './project-id'
import { mount } from 'cypress-react-unit-test'
import Collapse, { Panel } from 'rc-collapse'

import ipc from '../lib/ipc'

/* global cy */
describe('ProjectId', () => {
  const project = {
    id: 'fake-project-id',
    configFile: false,
  }

  // NOTE: could not get styles to load and apply yet
  it.skip('has styles', () => {
    const TestProjectId = ({ project }) => (
      <div className='settings-wrapper'>
        <Collapse>
          <Panel header='Project ID' key='project-id' className='form-horizontal settings-project-id'>
            <ProjectId project={project} />
          </Panel>
        </Collapse>
      </div>
    )

    mount(<TestProjectId project={project} />)
  })

  // NOTE: https://github.com/cypress-io/cypress/issues/7012
  it.skip('loads', () => {
    cy.stub(ipc, 'externalOpen').as('externalOpen')
    mount(<ProjectId project={project} />)

    cy.contains('a', 'Learn more')
    .click()

    cy.get('@externalOpen').should('have.been.called')
  })
})
