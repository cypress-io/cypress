import { describe, expect, it } from 'vitest'
import { resolveDevelopmentWorkspaceNumber } from '../../lib/development-workspace'

describe('resolveDevelopmentWorkspaceNumber', () => {
  it.each([1, 2, 3, 4, 5])('accepts workspace %s', (workspaceNum) => {
    expect(resolveDevelopmentWorkspaceNumber('development', { CYPRESS_INTERNAL_WORKSPACE_NUM: String(workspaceNum) })).toBe(workspaceNum)
  })

  it.each([undefined, '0'])('uses default ports and storage without selector %j', (workspaceNum) => {
    expect(resolveDevelopmentWorkspaceNumber('development', { CYPRESS_INTERNAL_WORKSPACE_NUM: workspaceNum })).toBeUndefined()
  })

  it.each(['', '6', '7', '-1', '1.5', '4abc', '04', ' 4', '4 ', 'NaN'])('rejects malformed selector %j', (workspaceNum) => {
    expect(() => resolveDevelopmentWorkspaceNumber('development', { CYPRESS_INTERNAL_WORKSPACE_NUM: workspaceNum }))
    .toThrow(`CYPRESS_INTERNAL_WORKSPACE_NUM must be an integer from 0 to 5; received ${JSON.stringify(workspaceNum)}`)
  })

  it.each(['production', 'staging', 'test', undefined])('ignores selectors outside development (%s)', (environment) => {
    expect(resolveDevelopmentWorkspaceNumber(environment, { CYPRESS_INTERNAL_WORKSPACE_NUM: 'invalid' })).toBeUndefined()
  })
})
