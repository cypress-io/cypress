import { describe, expect, it } from 'vitest'
import { resolveDevelopmentCloudWorkspaceNumber } from '../../lib/development-cloud-workspace'

describe('resolveDevelopmentCloudWorkspaceNumber', () => {
  it.each([1, 2, 3, 4, 5])('accepts workspace %s', (cloudWorkspaceNum) => {
    expect(resolveDevelopmentCloudWorkspaceNumber('development', { CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM: String(cloudWorkspaceNum) })).toBe(cloudWorkspaceNum)
  })

  it.each([undefined, '0'])('uses default ports and storage without selector %j', (cloudWorkspaceNum) => {
    expect(resolveDevelopmentCloudWorkspaceNumber('development', { CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM: cloudWorkspaceNum })).toBeUndefined()
  })

  it.each(['', '6', '7', '-1', '1.5', '4abc', '04', ' 4', '4 ', 'NaN'])('rejects malformed selector %j', (cloudWorkspaceNum) => {
    expect(() => resolveDevelopmentCloudWorkspaceNumber('development', { CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM: cloudWorkspaceNum }))
    .toThrow(`CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM must be an integer from 0 to 5; received ${JSON.stringify(cloudWorkspaceNum)}`)
  })

  it.each(['production', 'staging', 'test', undefined])('ignores selectors outside development (%s)', (environment) => {
    expect(resolveDevelopmentCloudWorkspaceNumber(environment, { CYPRESS_INTERNAL_CLOUD_WORKSPACE_NUM: 'invalid' })).toBeUndefined()
  })
})
