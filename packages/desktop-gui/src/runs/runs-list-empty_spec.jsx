import RunsListEmpty from './runs-list-empty'
import React from 'react'
import { mount } from '@cypress/react'
import '../main.scss'

/* global cy */
describe('RunsListEmpty', () => {
  it('should display only a loder is orgId is missing', () => {
    mount(<RunsListEmpty project={{
      clientDetails: cy.stub(),
    }}/>)

    cy.get('.loader').should('exist')
  })

  it('Displays a tutorial to record your first run', () => {
    mount(<RunsListEmpty project={{
      id: 'id1234',
      clientDetails: cy.stub(),
      orgId: 'appl',
      getTestGroup: cy.stub().returns(false),
      configFile: 'cypress.config.js',
    }}
    recordKey="123456-456789-789123"/>)

    cy.get('.first-run-instructions').should('exist')

    cy.percySnapshot()
  })

  it('Displays another tutorial to record your first run', () => {
    mount(<RunsListEmpty project={{
      id: 'id1234',
      clientDetails: cy.stub(),
      orgId: 'appl',
      getTestGroup: cy.stub().returns(true),
      configFile: 'cypress.config.js',
    }}
    recordKey="123456-456789-789123"/>)

    cy.get('.new-first-run-instructions').should('exist')

    cy.percySnapshot()
  })
})
