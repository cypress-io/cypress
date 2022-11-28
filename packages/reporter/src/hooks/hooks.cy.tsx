import React from 'react'
import { Hook } from './hooks'

import '../main.scss'

describe('hooks/hooks.tsx', () => {
  it('should mount', () => {
    const model = {
      failed: false,
      hookName: 'TEST BODY',
    }

    cy.mount(<div className="runnable suite">
      <div className="hooks-container">
        <Hook model={model} showNumber={false} />
      </div>
    </div>)

    cy.percySnapshot()

    cy.contains('TEST BODY').click().realHover()
    cy.percySnapshot()
  })
})
