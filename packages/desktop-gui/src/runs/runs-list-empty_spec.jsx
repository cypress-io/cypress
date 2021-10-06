import RunsListEmpty from './runs-list-empty'
import React from 'react'
import { mount } from '@cypress/react'
import '../main.scss'

/* global cy */
describe('RunsList', () => {
  it('retries pinging API server', () => {
    mount(<RunsListEmpty project={{
      id: 'id1234',
      clientDetails: cy.stub(),
      orgId: 'appl',
      getTestGroup: cy.stub(),
      configFile: 'cypress.config.js',
    }}
    recordKey="123456-456789-789123"/>)
  })
})
