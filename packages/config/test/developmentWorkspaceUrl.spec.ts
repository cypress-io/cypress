import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveDevelopmentWorkspaceNumber, resolveDevelopmentWorkspaceUrl } from '../src/developmentWorkspaceUrl'

describe('resolveDevelopmentWorkspaceNumber', () => {
  it.each([1, 2, 3, 4, 5])('resolves development workspace %s', (workspace) => {
    expect(resolveDevelopmentWorkspaceNumber('development', { CYPRESS_INTERNAL_WORKSPACE_NUM: String(workspace) })).toBe(workspace)
  })

  it.each([undefined, '0'])('returns no workspace when the selector is %s', (workspace) => {
    expect(resolveDevelopmentWorkspaceNumber('development', { CYPRESS_INTERNAL_WORKSPACE_NUM: workspace })).toBeUndefined()
  })

  it.each(['production', 'staging', 'test', undefined])('ignores the selector in %s', (environment) => {
    expect(resolveDevelopmentWorkspaceNumber(environment, { CYPRESS_INTERNAL_WORKSPACE_NUM: '4' })).toBeUndefined()
    expect(resolveDevelopmentWorkspaceNumber(environment, { CYPRESS_INTERNAL_WORKSPACE_NUM: 'invalid' })).toBeUndefined()
  })

  it('rejects an invalid development workspace', () => {
    expect(() => resolveDevelopmentWorkspaceNumber('development', { CYPRESS_INTERNAL_WORKSPACE_NUM: '7' })).toThrow('CYPRESS_INTERNAL_WORKSPACE_NUM must be an integer from 0 to 5')
  })
})

describe('resolveDevelopmentWorkspaceUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each([[0, 3000, 1234], [1, 13000, 11234], [2, 23000, 21234], [3, 33000, 31234], [4, 43000, 41234], [5, 53000, 51234]])('routes workspace %s to the expected localhost ports', (workspace, dashboardPort, apiPort) => {
    const env = { CYPRESS_INTERNAL_WORKSPACE_NUM: String(workspace) }

    expect(resolveDevelopmentWorkspaceUrl('http://localhost:3000', 'development', env)).toBe(`http://localhost:${dashboardPort}`)
    expect(resolveDevelopmentWorkspaceUrl('http://localhost:1234/', 'development', env)).toBe(`http://localhost:${apiPort}/`)
  })

  it.each([undefined, '0'])('keeps default ports when the workspace is %s', (workspace) => {
    expect(resolveDevelopmentWorkspaceUrl('http://localhost:3000', 'development', { CYPRESS_INTERNAL_WORKSPACE_NUM: workspace })).toBe('http://localhost:3000')
  })

  it.each(['', '6', '7', '-1', '4.5', '04', '4e0', '4abc', ' 4 ', 'NaN', 'Infinity'])('rejects malformed workspace %s in development', (workspace) => {
    expect(() => resolveDevelopmentWorkspaceUrl('http://localhost:3000', 'development', { CYPRESS_INTERNAL_WORKSPACE_NUM: workspace })).toThrow(
      `CYPRESS_INTERNAL_WORKSPACE_NUM must be an integer from 0 to 5; received ${JSON.stringify(workspace)}`,
    )
  })

  it.each(['production', 'staging', 'test', undefined])('ignores the selector for the %s environment', (environment) => {
    expect(resolveDevelopmentWorkspaceUrl('http://localhost:1234/', environment, { CYPRESS_INTERNAL_WORKSPACE_NUM: '4' })).toBe('http://localhost:1234/')
    expect(resolveDevelopmentWorkspaceUrl('http://localhost:1234/', environment, { CYPRESS_INTERNAL_WORKSPACE_NUM: 'invalid' })).toBe('http://localhost:1234/')
  })

  it('keeps non-localhost URLs unchanged', () => {
    const url = 'https://api.cypress.io/'

    expect(resolveDevelopmentWorkspaceUrl(url, 'development', { CYPRESS_INTERNAL_WORKSPACE_NUM: '4' })).toBe(url)
  })

  it('preserves paths, query strings, fragments, and the trailing slash', () => {
    const env = { CYPRESS_INTERNAL_WORKSPACE_NUM: '4' }

    expect(resolveDevelopmentWorkspaceUrl('http://localhost:3000/path/?next=%2Ffoo#section', 'development', env)).toBe('http://localhost:43000/path/?next=%2Ffoo#section')
    expect(resolveDevelopmentWorkspaceUrl('http://localhost:3000?next=%2Ffoo', 'development', env)).toBe('http://localhost:43000?next=%2Ffoo')
  })

  it('rejects offsets that exceed the TCP port range', () => {
    expect(() => resolveDevelopmentWorkspaceUrl('http://localhost:20000', 'development', { CYPRESS_INTERNAL_WORKSPACE_NUM: '5' })).toThrow('invalid localhost port: 70000')
  })

  it('reads the workspace from process.env by default', () => {
    vi.stubEnv('CYPRESS_INTERNAL_WORKSPACE_NUM', '4')

    expect(resolveDevelopmentWorkspaceUrl('http://localhost:3000', 'development')).toBe('http://localhost:43000')
  })
})
