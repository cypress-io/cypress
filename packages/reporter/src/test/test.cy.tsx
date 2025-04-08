import React from 'react'
import Test from './test'

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
        model={model}
        appState={appState}
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
        model={model}
        appState={appState}
        studioEnabled
      />
    </div>)

    cy.percySnapshot()

    cy.contains('foobar').click().realHover()

    cy.get('[data-cy="launch-studio"]').should('exist')

    cy.percySnapshot()
  })
})
