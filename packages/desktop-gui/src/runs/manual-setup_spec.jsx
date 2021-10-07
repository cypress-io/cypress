import { ManualSetup } from './manual-setup'
import React from 'react'
import { mount } from '@cypress/react'
import appStore from '../lib/app-store'
import projectsApi from '../projects/projects-api'
import '../main.scss'

/* global cy */
describe('ManualSetup', () => {
  it('Should reopen the project when hitting retry', { viewportHeight: 700 }, () => {
    const error = {
      message: `In your config file, cypress cannot set your \`projectId\` key to \`"iy7z59"\``,
      details: 'Exported object is not an object literal',
      payload: {
        projectId: 'id1234',
      },
    }

    appStore.projectRoot = '/exp/test-config-js/cypress.config.js'
    cy.stub(projectsApi, 'reopenProject').resolves({ id: 'id1234' })
    const retryInsertStub = cy.stub()

    mount(<div style={{ width: '500px', margin: '24px auto' }}>
      <ManualSetup
        error={error}
        configFile={'config.custom.js'}
        project={{ id: 'test' }}
        retryInsert={retryInsertStub}
      />
    </div>)

    cy.percySnapshot()

    cy.contains('button', 'Try again').click().then(() => {
      expect(retryInsertStub).not.to.have.been.called
      expect(projectsApi.reopenProject).to.have.been.called
    })
  })
})
