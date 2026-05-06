import { describe, it, expect } from 'vitest'
import { getSupportFileRelativePath } from '../src/waitForSupportFile'

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
