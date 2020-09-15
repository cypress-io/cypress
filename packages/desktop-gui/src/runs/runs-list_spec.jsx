import RunsList from './runs-list'
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import ipc from '../lib/ipc'

/* global cy */
describe('RunsList', () => {
  it('retries pinging API server', () => {
    const pingApiServer = cy.stub(ipc, 'pingApiServer').rejects(new Error('No No No'))

    mount(<RunsList />, {
      stylesheets: '/__root/dist/app.css',
    })

    cy.wrap(pingApiServer).should('have.been.calledOnce')
    cy.get('.empty-no-api-server').should('be.visible')
    .contains('Try again').click()

    cy.wrap(pingApiServer).should('have.been.calledTwice')
  })
})
