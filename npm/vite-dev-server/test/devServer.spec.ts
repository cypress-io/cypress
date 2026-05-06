import { describe, it, expect } from 'vitest'
import { getSpecRelativeUrl, getSupportFileRelativePath } from '../src/devServer'

describe('getSupportFileRelativePath', () => {
  it('builds path matching client logic when devServerPublicPathRoute is set', () => {
    const cypressConfig = {
      projectRoot: '/users/proj',
      supportFile: '/users/proj/cypress/support/component.ts',
      devServerPublicPathRoute: '/__cypress/src',
      platform: 'darwin',
    } as Cypress.PluginConfigOptions

    expect(getSupportFileRelativePath(cypressConfig)).toBe('/__cypress/src/cypress/support/component.ts')
  })

  it('returns empty string when supportFile is not set', () => {
    const cypressConfig = {
      projectRoot: '/users/proj',
      supportFile: undefined,
      devServerPublicPathRoute: '/__cypress/src',
      platform: 'darwin',
    } as Cypress.PluginConfigOptions

    expect(getSupportFileRelativePath(cypressConfig)).toBe('')
  })

  it('handles win32 paths with backslashes', () => {
    const cypressConfig = {
      projectRoot: 'C:\\users\\proj',
      supportFile: 'C:\\users\\proj\\cypress\\support\\component.ts',
      devServerPublicPathRoute: '/__cypress/src',
      platform: 'win32',
    } as Cypress.PluginConfigOptions

    expect(getSupportFileRelativePath(cypressConfig)).toBe('/__cypress/src/cypress/support/component.ts')
  })

  it('uses relative path when devServerPublicPathRoute is empty', () => {
    const cypressConfig = {
      projectRoot: '/users/proj',
      supportFile: '/users/proj/cypress/support/component.ts',
      devServerPublicPathRoute: '',
      platform: 'darwin',
    } as Cypress.PluginConfigOptions

    expect(getSupportFileRelativePath(cypressConfig)).toBe('./cypress/support/component.ts')
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
