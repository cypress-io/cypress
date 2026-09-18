import { describe, it, expect, vi, beforeEach } from 'vitest'

const openExternal = vi.hoisted(() => vi.fn())

vi.mock('electron', () => {
  return {
    shell: {
      openExternal,
    },
  }
})

import { openExternal as openExternalLink } from '../../../lib/gui/links'

describe('lib/gui/links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens urls passed as strings', () => {
    openExternalLink('https://on.cypress.io/string-link')
    expect(openExternal).toHaveBeenCalledWith('https://on.cypress.io/string-link')
  })
})
