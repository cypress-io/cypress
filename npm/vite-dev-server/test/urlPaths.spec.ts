import { describe, it, expect } from 'vitest'
import { getSpecRelativeUrl, getSupportFileRelativeUrl } from '../src/urlPaths'

describe('getSupportFileRelativeUrl', () => {
  it('returns the path relative to projectRoot, without any base prefix', () => {
    const cypressConfig = {
      projectRoot: '/users/proj',
      supportFile: '/users/proj/cypress/support/component.ts',
      platform: 'darwin',
    } as Cypress.PluginConfigOptions

    expect(getSupportFileRelativeUrl(cypressConfig)).toBe('/cypress/support/component.ts')
  })

  it('returns empty string when supportFile is not set', () => {
    const cypressConfig = {
      projectRoot: '/users/proj',
      supportFile: undefined,
      platform: 'darwin',
    } as Cypress.PluginConfigOptions

    expect(getSupportFileRelativeUrl(cypressConfig)).toBe('')
  })

  it('handles win32 paths with backslashes', () => {
    const cypressConfig = {
      projectRoot: 'C:\\users\\proj',
      supportFile: 'C:\\users\\proj\\cypress\\support\\component.ts',
      platform: 'win32',
    } as Cypress.PluginConfigOptions

    expect(getSupportFileRelativeUrl(cypressConfig)).toBe('/cypress/support/component.ts')
  })
})

describe('getSpecRelativeUrl', () => {
  it('builds /@fs path without the dev server base prefix', () => {
    const spec = { absolute: '/users/proj/src/components/Foo.cy.tsx' }
    const cypressConfig = {
      platform: 'darwin',
    } as Cypress.PluginConfigOptions

    expect(getSpecRelativeUrl(spec, cypressConfig)).toBe('/@fs/users/proj/src/components/Foo.cy.tsx')
  })

  it('normalizes win32 backslashes to forward slashes', () => {
    const spec = { absolute: 'C:\\users\\proj\\src\\components\\Foo.cy.tsx' }
    const cypressConfig = {
      platform: 'win32',
    } as Cypress.PluginConfigOptions

    expect(getSpecRelativeUrl(spec, cypressConfig)).toBe('/@fs/C:/users/proj/src/components/Foo.cy.tsx')
  })
})
