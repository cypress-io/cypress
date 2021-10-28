import React from 'react'
import { mount } from '@cypress/react'
import RunnerCt from '../../src/app/RunnerCt'
import '@packages/runner/src/main.scss'
import { makeState, fakeConfig } from './utils'
import { EventManager } from '@packages/runner-shared'

describe('Spec File with Whitespace', () => {
  it('renders RunnerCt', () => {
    const eventManager = new EventManager()

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
