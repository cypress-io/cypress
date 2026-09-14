import React from 'react'
import { Hook } from './hooks'
import type HookModel from './hook-model'

import '../main.scss'

describe('hooks/hooks.tsx', () => {
  it('should mount', () => {
    // a stub of only what Hook renders; hookName is deliberately not a real
    // HookName so the assertion below matches the rendered text verbatim
    const model = {
      failed: false,
      hookName: 'TEST BODY',
    } as unknown as HookModel

    cy.mount(<div className="runnable suite">
      <div className="hooks-container">
        <Hook model={model} showNumber={false} scrollIntoView={() => {}} />
      </div>
    </div>)

    cy.percySnapshot()

    cy.contains('TEST BODY').click().realHover()
    cy.percySnapshot()
  })
})
