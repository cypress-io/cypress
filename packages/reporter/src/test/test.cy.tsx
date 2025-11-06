import React from 'react'
import Test from './test'
import { AppState } from '../lib/app-state'
import TestModel from './test-model'
import { Events } from '../lib/events'

describe('test/test.tsx', () => {
  it('should mount', () => {
    const model = {
      isOpen: false,
      level: 0,
      state: 'passed',
      title: 'foobar',
      attempts: [],
      setIsOpen: (isOpen) => model.isOpen = isOpen,
      onOpenStateChangeRequested: (isOpen) => model.setIsOpen(isOpen),
      callbackAfterUpdate: () => undefined,
    }

    const appState = {
      studioActive: false,
    } as AppState

    cy.mount(<div className="runnable suite">
      <Test
        model={model as unknown as TestModel}
        appState={appState}
        studioEnabled={false}
        isFirstTest={false}
      />
    </div>)

    cy.percySnapshot()

    cy.contains('foobar').click().realHover()
    cy.get('[data-cy="launch-studio"]').should('not.exist')
    cy.percySnapshot()
  })

  it('should mount with studio enabled', () => {
    const model = {
      isOpen: false,
      level: 0,
      state: 'passed',
      title: 'foobar',
      attempts: [],
      setIsOpen: (isOpen) => model.isOpen = isOpen,
      onOpenStateChangeRequested: (isOpen) => model.setIsOpen(isOpen),
      callbackAfterUpdate: () => undefined,
    }

    const appState = {
      studioActive: false,
    } as AppState

    cy.mount(<div className="runnable suite">
      <Test
        model={model as unknown as TestModel}
        appState={appState}
        studioEnabled
        isFirstTest={false}
      />
    </div>)

    cy.percySnapshot()

    cy.contains('foobar').click().realHover()

    cy.get('[data-cy="launch-studio"]').should('exist')

    cy.percySnapshot()
  })

  it('should mount with studio tooltip guide', () => {
    const model = {
      isOpen: false,
      level: 0,
      state: 'passed',
      title: 'foobar',
      attempts: [],
      setIsOpen: (isOpen) => model.isOpen = isOpen,
      onOpenStateChangeRequested: (isOpen) => model.setIsOpen(isOpen),
      callbackAfterUpdate: () => undefined,
    }

    const appState = {
      studioActive: false,
      isStudioWelcomePanelActive: true,
      studioTooltipDismissed: false,
    } as AppState

    cy.mount(<div className="runnable suite">
      <Test
        model={model as unknown as TestModel}
        appState={appState}
        studioEnabled
        isFirstTest
      />
    </div>)

    cy.get('[data-cy="studio-tooltip-guide"]').should('exist')

    cy.percySnapshot()
  })

  it('should handle dismissing studio tooltip guide and launching studio', () => {
    const model = {
      id: 'test-id',
      isOpen: false,
      level: 0,
      state: 'passed',
      title: 'foobar',
      attempts: [],
      setIsOpen: (isOpen) => model.isOpen = isOpen,
      onOpenStateChangeRequested: (isOpen) => model.setIsOpen(isOpen),
      callbackAfterUpdate: () => undefined,
    }

    const appState = {
      studioActive: false,
      isStudioWelcomePanelActive: true,
      studioTooltipDismissed: false,
      setStudioTooltipDismissed: cy.stub().as('setStudioTooltipDismissed'),
    } as unknown as AppState

    const mockEvents = {
      emit: cy.stub().as('emit'),
    } as unknown as Events

    cy.mount(<div className="runnable suite">
      <Test
        model={model as unknown as TestModel}
        appState={appState}
        studioEnabled
        isFirstTest
        events={mockEvents}
      />
    </div>)

    cy.get('[data-cy="studio-tooltip-guide"]').click({ force: true })

    cy.get('@setStudioTooltipDismissed').should('have.been.calledWith', true)
    cy.get('@emit').should('have.been.calledWith', 'save:state')
    cy.get('@emit').should('have.been.calledWith', 'studio:init:test', { testId: model.id })

    cy.get('[data-cy="dismiss-studio-tooltip-icon"]').should('not.exist')
  })
})
