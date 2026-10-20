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

  it('opens http urls', () => {
    openExternalLink('http://localhost:3000/')
    expect(openExternal).toHaveBeenCalledWith('http://localhost:3000/')
  })

  it.each([
    'file:///etc/test',
    'smb://test.example/share',
    'vscode://file/etc/test',
    'javascript:alert(1)',
    'not a url',
  ])('does not open %s', async (url) => {
    await expect(openExternalLink(url)).rejects.toThrow('Only http and https URLs can be opened externally')

    expect(openExternal).not.toHaveBeenCalled()
  })

  it('does not open a url that is not a string', async () => {
    await expect(openExternalLink(['https://on.cypress.io'] as unknown as string)).rejects.toThrow('Only http and https URLs can be opened externally')

    expect(openExternal).not.toHaveBeenCalled()
  })
})
