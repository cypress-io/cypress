/// <reference types="@percy/cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import App from '../../src/app/RunnerCt'
import State from '../../src/lib/state'
import '@packages/runner/src/main.scss'

class FakeEventManager {
  start = () => { }
  on = () => { }
  stop = () => {}
  notifyRunningSpec = () => { }
}

describe('RunnerCt', () => {
  function assertSpecsListIs (state: 'closed' | 'open') {
    // for some reason should("not.be.visible") doesn't work here so ensure that specs list was outside of screen
    cy.get('[data-cy=specs-list]').then(([el]) => {
      const { x } = el.getBoundingClientRect()

      state === 'closed' ? expect(x).to.be.lessThan(0) : expect(x).to.be.lessThan(0)
    })
  }

  it('renders App', () => {
    cy.viewport(1000, 500)
    const state = new State({
      reporterWidth: 500,
      spec: null,
      specs: [{ relative: '/test.js', absolute: 'root/test.js', name: 'test.js' }],
    })

    mount(
      <App
        state={state}
        // @ts-ignore - this is difficult to stub. Real one breaks things.
        eventManager={new FakeEventManager()}
        config={{ projectName: 'Project', env: {} }}
      />,
    )

    cy.percySnapshot()
  })

  it('toggles specs list drawer using shortcut', () => {
    cy.viewport(1000, 500)
    const state = new State({
      reporterWidth: 500,
      spec: null,
      specs: [{ relative: '/test.js', absolute: 'root/test.js', name: 'test.js' }],
    })

    mount(
      <App
        state={state}
        // @ts-ignore - this is difficult to stub. Real one breaks things.
        eventManager={new FakeEventManager()}
        config={{ projectName: 'Project', env: {} }}
      />,
    )

    cy.window().then((win) => win.focus())
    cy.realPress(['Meta', 'B'])
    cy.wait(400) // can not wait for this animation automatically :(
    assertSpecsListIs('closed')

    cy.realPress(['Meta', 'B'])
    assertSpecsListIs('open')
  })

  context('specs-list resizing', () => {
    beforeEach(() => {
      cy.viewport(1000, 500)
      const state = new State({
        reporterWidth: 500,
        spec: null,
        specs: [{ relative: '/test.js', absolute: 'root/test.js', name: 'test.js' }],
      })

      mount(
        <App
          state={state}
          // @ts-ignore - this is difficult to stub. Real one breaks things.
          eventManager={new FakeEventManager()}
          config={{ projectName: 'Project', env: {} }}
        />,
      )
    })

    it('closes the spec list when selecting a spec', () => {
      cy.get('[data-cy=specs-list-resize-box').should('have.css', 'width', '300px')

      cy.get('[data-cy=resizer]').trigger('mousedown', 'center')
      cy.get('[data-cy=resizer]').trigger('mousemove', 'center', {
        clientX: 450,
      })

      cy.get('[data-cy=resizer]').trigger('mouseup', 'center')

      cy.get('[data-cy=specs-list-resize-box').should('have.css', 'width', '429px')
    })

    it('restore specs list width after closing and reopen', () => {
      cy.get('[data-cy=resizer]').trigger('mousedown', 'center')
      cy.get('[data-cy=resizer]').trigger('mousemove', 'center', {
        clientX: 500,
      })

      cy.get('[data-cy=resizer]').trigger('mouseup', 'center')
      cy.get('[data-cy=specs-list-resize-box').should('have.css', 'width', '479px')

      cy.get('[aria-label="Open the menu"').click()
      assertSpecsListIs('closed')

      cy.get('[aria-label="Open the menu"').click()

      cy.get('[data-cy=specs-list-resize-box').should('have.css', 'width', '479px')
    })
  })
})
