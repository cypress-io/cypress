import { describe, it, expect, beforeEach, vi } from 'vitest'
import { githubActionsDetectorSync } from '../../src/detectors/githubActionsDetectorSync'

describe('githubActionsDetectorSync', () => {
  describe('undefined values', () => {
    beforeEach(() => {
      vi.unstubAllEnvs()
      vi.stubEnv('GITHUB_ACTION', undefined)
      vi.stubEnv('GH_BRANCH', undefined)
      vi.stubEnv('GITHUB_HEAD_REF', undefined)
      vi.stubEnv('GITHUB_REF_NAME', undefined)
      vi.stubEnv('GITHUB_RUN_NUMBER', undefined)
      vi.stubEnv('GITHUB_SHA', undefined)
    })

    describe('detect', () => {
      it('returns an empty resource', () => {
        const resource = githubActionsDetectorSync.detect()

        expect(resource.attributes).toEqual({})
      })
    })
  })

  describe('defined values', () => {
    beforeEach(() => {
      vi.unstubAllEnvs()
      vi.stubEnv('GITHUB_ACTION', 'githubAction')
      vi.stubEnv('GH_BRANCH', 'ghBranch')
      vi.stubEnv('GITHUB_HEAD_REF', 'ghHeadRef')
      vi.stubEnv('GITHUB_REF_NAME', 'ghRefName')
      vi.stubEnv('GITHUB_RUN_NUMBER', 'ghRunNumber')
      vi.stubEnv('GITHUB_SHA', 'ghSha')
    })

    describe('detect', () => {
      it('returns a resource with attributes', () => {
        const resource = githubActionsDetectorSync.detect()

        expect(resource.attributes['ci.github_action']).toEqual('githubAction')
        expect(resource.attributes['ci.branch']).toEqual('ghBranch')
        expect(resource.attributes['ci.build-number']).toEqual('ghRunNumber')
        expect(resource.attributes['SHA1']).toEqual('ghSha')
      })

      it('returns a resource with attributes when GH_BRANCH is missing', () => {
        vi.stubEnv('GH_BRANCH', undefined)

        const resource = githubActionsDetectorSync.detect()

        expect(resource.attributes['ci.github_action']).toEqual('githubAction')
        expect(resource.attributes['ci.branch']).toEqual('ghHeadRef')
        expect(resource.attributes['ci.build-number']).toEqual('ghRunNumber')
        expect(resource.attributes['SHA1']).toEqual('ghSha')
      })

      it('returns a resource with attributes when GH_BRANCH and GITHUB_HEAD_REF is missing', () => {
        vi.stubEnv('GH_BRANCH', undefined)
        vi.stubEnv('GITHUB_HEAD_REF', undefined)

        const resource = githubActionsDetectorSync.detect()

        expect(resource.attributes['ci.github_action']).toEqual('githubAction')
        expect(resource.attributes['ci.branch']).toEqual('ghRefName')
        expect(resource.attributes['ci.build-number']).toEqual('ghRunNumber')
        expect(resource.attributes['SHA1']).toEqual('ghSha')
      })
    })
  })
})
