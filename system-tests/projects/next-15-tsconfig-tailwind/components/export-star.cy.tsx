import React from 'react'
import { UnreadBadge } from '.'
import { greeting } from '../pages-legacy'

// Next.js rejects `export *` in files it treats as pages. This project has no
// pages directory, so neither barrel, including the one in `pages-legacy/`, is a page.
describe('barrel files that use export *', () => {
  it('mounts components imported through them', () => {
    cy.mount(
      <div>
        <UnreadBadge count={3} />
        <p>{greeting('Ada Lovelace')}</p>
      </div>,
    )

    cy.contains('span', '3 unread')
    cy.contains('p', 'Welcome back, Ada Lovelace')
  })
})
