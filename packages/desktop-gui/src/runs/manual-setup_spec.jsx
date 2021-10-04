import { ManualSetup } from './manual-setup'
import React from 'react'
import { mount } from '@cypress/react'
import appStore from '../lib/app-store'
import projectsApi from '../projects/projects-api'

/* global cy */
describe('ManualSetup', () => {
  it('Should reopen the project when hitting retry', () => {
    const error = {
      message: '-!- there was an error updating your file -!-',
      details: '--because your failure--',
    }

    appStore.projectRoot = '/path/to/project'
    cy.stub(projectsApi, 'reopenProject').resolves({ projectId: 'id1234' })

    mount(<ManualSetup
      error={error}
      configFile={'config.custom.js'}
      project={{ id: 'test' }}
    />, {
      stylesheets: '/__root/dist/app.css',
    })

    cy.contains('button', 'Retry').click().then(() => {
      expect(projectsApi.reopenProject).to.have.been.called
    })
  })
})
