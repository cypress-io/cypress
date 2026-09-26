import { describe, it, expect, vi, beforeEach } from 'vitest'
import { openExternal as openExternalLink } from '../../../lib/gui/links'

const openExternal = vi.hoisted(() => {
  return vi.fn()
})

vi.mock('electron', () => {
  return {
    shell: {
      openExternal,
    },
  }
})

describe('lib/gui/links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens urls passed as strings', () => {
    openExternalLink('https://on.cypress.io/string-link')
    expect(openExternal).toHaveBeenCalledWith('https://on.cypress.io/string-link')
  })
})
