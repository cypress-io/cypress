/// <reference types="cypress" />
import React from 'react'
import Experiments from './experiments'
import Collapse, { Panel } from 'rc-collapse'
import { mount } from 'cypress-react-unit-test'

/* global cy */
describe('Experiments', () => {
  beforeEach(() => {
    cy.fixture('config').as('config')
  })

  const TestExperiments = ({ project }) => (
    <div className='settings-wrapper'>
      <Collapse>
        <Panel header='Experiments' key='project-id' className='form-horizontal settings-experiments'>
          <Experiments project={project} />
        </Panel>
      </Collapse>
    </div>
  )

  it('loads', function () {
    this.config.experimentalCoolFeature = true
    this.config.resolved.experimentalCoolFeature = {
      value: true,
    }

    const project = {
      config: this.config,
    }

    mount(<TestExperiments project={project} />, {
      cssFiles: 'dist/app.css',
    })
  })
})
