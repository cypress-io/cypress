/// <reference types="@percy/cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import RunnerCt from '../../src/app/RunnerCt'
import State from '../../src/lib/state'
import '@packages/runner/src/main.scss'

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
  stop = noop
  notifyRunningSpec = noop
  saveState: Function = () => { }
}

const fakeConfig = { projectName: 'Project', env: {}, isTextTerminal: false } as any as Cypress.RuntimeConfigOptions
const makeState = (options = {}) => (new State({
  reporterWidth: 500,
  spec: null,
  specs: [{ relative: '/test.js', absolute: 'root/test.js', name: 'test.js' }],
  ...options,
}))

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
        config={fakeConfig} />)

      cy.get(selectors.noSpecSelectedReporter).should('exist')
      cy.percySnapshot()
    })
  })
})
