import React from 'react'
import { mount } from '@cypress/react'
import RunnerCt from '../../src/app/RunnerCt'
import '@packages/runner/src/main.scss'
import { makeState, fakeConfig, createEventManager } from './utils'

describe('Spec File with Whitespace', () => {
  it('renders RunnerCt', () => {
    const eventManager = createEventManager()

    mount(
      <RunnerCt
        state={makeState()}
        eventManager={eventManager}
        config={fakeConfig}
      />,
    )

    // ensures that the spec was executed
    cy.get('h2').contains('No spec selected.')
  })
})
