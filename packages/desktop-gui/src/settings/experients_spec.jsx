import React from 'react'
import Experiments from './experiments'
import Collapse, { Panel } from 'rc-collapse'
import { mount } from 'cypress-react-unit-test'
import experiments from '@packages/server/lib/experiments'

/* global cy */
describe('Experiments', () => {
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
    cy.stub(experiments, 'getExperiments').returns({
      testExperiment: {
        key: 'testExperiment',
        value: true,
        enabled: true,
        name: 'Text Experiment 1',
        summary: 'Experiment `description` with **Markdown** support!',
      },
      testExperiment2: {
        key: 'testExperiment2',
        value: 4,
        enabled: false,
        name: 'another experiment',
        summary: 'Even better 🎉 experiment',
      },
    })

    const project = {}

    mount(<TestExperiments project={project} />, {
      stylesheets: '/__root/dist/app.css',
    })

    cy.get('.settings-experiments').click()
  })
})
