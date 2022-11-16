import React from 'react'
import Sessions from './sessions'
import SessionsModel from './sessions-model'
import events from '../lib/events'

describe('sessions instrument panel', { viewportWidth: 400 }, () => {
  it('renders null when no sessions have been added', () => {
    cy.mount(<Sessions model={[]}/>)

    cy.get('.sessions-container').should('not.exist')

    cy.percySnapshot()
  })

  describe('renders with sessions', () => {
    const specSession = new SessionsModel({
      name: 'session',
      state: 'passed',
      type: 'parent',
      testId: '1',
      id: 1,
      testCurrentRetry: 1,
      sessionInfo: {
        id: 'spec_session',
        isGlobalSession: false,
        status: 'created',
      },
    })

    const globalSession = new SessionsModel({
      name: 'session',
      state: 'passed',
      type: 'parent',
      testId: '1',
      id: 2,
      testCurrentRetry: 1,
      sessionInfo: {
        id: 'global_session',
        isGlobalSession: true,
        status: 'restored',
      },
    })

    const warnedSpecSession = new SessionsModel({
      name: 'session',
      state: 'warned',
      type: 'parent',
      testId: '1',
      id: 3,
      sessionInfo: {
        id: 'spec_session_warned',
        isGlobalSession: false,
        status: 'recreated',
      },
      testCurrentRetry: 1,
    })

    const failedSpecSession = new SessionsModel({
      name: 'session',
      state: 'failed',
      type: 'parent',
      testId: '1',
      id: 3,
      sessionInfo: {
        id: 'spec_session_failed',
        isGlobalSession: false,
        status: 'failed',
      },
      testCurrentRetry: 1,
    })

    beforeEach(() => {
      cy.mount(<Sessions model={[specSession, globalSession, warnedSpecSession, failedSpecSession]}/>)

      cy.get('.sessions-container').should('exist')
      cy.get('.hook-header > .collapsible-header').as('header')
      cy.contains('Clear All Sessions')
    })

    it('is collapsed by default', () => {
      cy.get('@header').should('have.attr', 'aria-expanded', 'false')
      cy.percySnapshot()
    })

    it('opens/closes when clicking panel', () => {
      cy.get('@header').click()

      cy.get('@header').should('have.attr', 'aria-expanded', 'true')

      cy.get('.session-item')
      .should('have.length', 4)
      .should('be.visible')

      cy.percySnapshot()
    })

    it('has spec session item', () => {
      cy.get('@header').click()

      cy.get('.session-item').eq(0)
      .within(() => {
        cy.contains('spec_session').should('have.class', 'spec-session')
        cy.get('.global-session-icon').should('not.exist')
        cy.get('.session-status').should('have.class', 'successful-status')
      })

      cy.percySnapshot()
    })

    it('has global session item', () => {
      cy.get('@header').click()

      cy.get('.session-item').eq(1)
      .within(() => {
        cy.contains('global_session').should('not.have.class', 'spec-session')
        cy.get('.global-session-icon').should('exist')
        cy.get('.session-status').should('have.class', 'successful-status')
      })

      cy.percySnapshot()
    })

    it('has warned session item', () => {
      cy.get('@header').click()

      cy.get('.session-item')
      .eq(2)
      .within(() => {
        cy.contains('spec_session_warned').should('have.class', 'spec-session')
        cy.get('.session-status').should('have.class', 'warned-status')
      })

      cy.percySnapshot()
    })

    it('has failed session item', () => {
      cy.get('@header').click()

      cy.get('.session-item')
      .eq(3)
      .within(() => {
        cy.contains('spec_session_failed').should('have.class', 'spec-session')
        cy.get('.global-session-icon').should('not.exist')
        cy.get('.session-status').should('have.class', 'failed-status')
      })

      cy.percySnapshot()
    })

    it('clicking session item prints details to the console', () => {
      cy.spy(events, 'emit')

      cy.get('@header').click()

      cy.get('.session-item').eq(3).click()

      cy.get('.cy-tooltip')
      .should('have.text', 'Printed output to your console')
      .then(() => {
        expect(events.emit).to.be.calledWith('show:command', failedSpecSession.testId, failedSpecSession.id)
      })
    })

    it('clicking "Clear All Sessions" button emits "clear:all:sessions" event', () => {
      cy.spy(events, 'emit')

      cy.contains('Clear All Sessions').click()
      .then(() => {
        expect(events.emit).to.be.calledWith('clear:all:sessions')
      })
    })
  })
})
