import React from 'react'
import Test from './test'
import type TestModel from './test-model'
import type { AppState } from '../lib/app-state'

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
    }

    cy.mount(<div className="runnable suite">
      <Test
        model={model as unknown as TestModel}
        appState={appState as unknown as AppState}
        studioEnabled={false}
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
    }

    cy.mount(<div className="runnable suite">
      <Test
        model={model as unknown as TestModel}
        appState={appState as unknown as AppState}
        studioEnabled
      />
    </div>)

    cy.percySnapshot()

    cy.contains('foobar').click().realHover()

    cy.get('[data-cy="launch-studio"]').should('exist')

    cy.percySnapshot()
  })
})
