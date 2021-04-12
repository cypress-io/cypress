/// <reference types="@percy/cypress" />
/// <reference types="cypress-real-events" />
import React from 'react'
import { mount } from '@cypress/react'
import RunnerCt from '../../src/app/RunnerCt'
import '@packages/runner/src/main.scss'
import { makeState, fakeConfig } from './utils'

const selectors = {
  reporter: '[data-cy=reporter]',
  noSpecSelectedReporter: '[data-cy=no-spec-selected-reporter]',
  specsList: '[data-cy=specs-list]',
  searchInput: 'input[placeholder="Find spec..."]',
}

interface Overrides {
  saveState?: Function
}

const noop = () => {}

class FakeEventManager {
  constructor (overrides: Overrides = {}) {
    this.saveState = overrides.saveState || noop
  }

  start = noop
  on = noop
  off = noop
  stop = noop
  notifyRunningSpec = noop
  saveState: Function = () => { }
}

describe('RunnerCt', () => {
  beforeEach(() => {
    cy.viewport(1000, 500)
  })

  it('renders RunnerCt', () => {
    mount(
      <RunnerCt
        state={makeState()}
        // @ts-ignore - this is difficult to stub. Real one breaks things.
        eventManager={new FakeEventManager()}
        config={fakeConfig}
      />,
    )

    cy.percySnapshot()
  })

  it('renders RunnerCt for video recording', () => {
    mount(
      <RunnerCt
        state={makeState()}
        // @ts-ignore - this is difficult to stub. Real one breaks things.
        eventManager={new FakeEventManager()}
        config={{ ...fakeConfig, isTextTerminal: true }}
      />,
    )

    cy.percySnapshot()
  })

  it('shows hint message if no component specs', () => {
    mount(
      <RunnerCt
        state={makeState({ specs: [] })}
        // @ts-ignore - this is difficult to stub. Real one breaks things.
        eventManager={new FakeEventManager()}
        config={{ ...fakeConfig, projectRoot: '/root', componentFolder: '/root/src' }}
      />,
    )

    cy.contains('No specs found')
    cy.percySnapshot()
  })

  context('keyboard shortcuts', () => {
    it('toggles specs list drawer using shortcut', () => {
      const saveState = cy.stub()

      mount(
        <RunnerCt
          state={makeState()}
          // @ts-ignore - this is difficult to stub. Real one breaks things.
          eventManager={new FakeEventManager({ saveState })}
          config={fakeConfig}
        />,
      )

      cy.window().then((win) => win.focus())
      cy.get(selectors.specsList).should('be.visible')

      cy.realPress(['Meta', 'B'])
      cy.get(selectors.specsList).should('not.be.visible').then(() => {
        expect(saveState).to.have.been.calledWith({ ctIsSpecsListOpen: false })
      })

      cy.realPress(['Meta', 'B'])
      cy.get(selectors.specsList).should('be.visible').then(() => {
        expect(saveState).to.have.been.calledWith({ ctIsSpecsListOpen: false }),
        expect(saveState).to.have.been.calledWith({ ctIsSpecsListOpen: true })
      })
    })

    it('focuses the search field on "/"', () => {
      mount(
        <RunnerCt
          state={makeState()}
          // @ts-ignore - this is difficult to stub. Real one breaks things.
          eventManager={new FakeEventManager()}
          config={fakeConfig}
        />,
      )

      cy.realPress('/')
      cy.get(selectors.searchInput).should('be.focused')
    })
  })

  context('no spec selected', () => {
    it('hides reporter', () => {
      mount(<RunnerCt
        state={makeState({ spec: null })}
        // @ts-ignore - this is difficult to stub. Real one breaks things.
        eventManager={new FakeEventManager()}
        config={fakeConfig}
      />)

      cy.get(selectors.noSpecSelectedReporter).should('exist')
    })
  })
})
