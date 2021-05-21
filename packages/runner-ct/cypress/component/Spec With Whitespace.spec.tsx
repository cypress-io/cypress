import React from 'react'
import { mount } from '@cypress/react'
import RunnerCt from '../../src/app/RunnerCt'
import '@packages/runner/src/main.scss'
import { makeState, fakeConfig, FakeEventManager } from './utils'

describe('Spec File with Whitespace', () => {
  it('renders RunnerCt', () => {
    mount(
      <RunnerCt
        state={makeState()}
        // @ts-ignore - this is difficult to stub. Real one breaks things.
        eventManager={new FakeEventManager()}
        config={fakeConfig}
      />
    )

    // ensures that the spec was executed
    cy.get('h2').contains('No spec selected.')
  })
})
