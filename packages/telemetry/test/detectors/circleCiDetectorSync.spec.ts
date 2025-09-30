import { describe, it, expect, beforeEach, vi } from 'vitest'
import { circleCiDetectorSync } from '../../src/detectors/circleCiDetectorSync'

describe('circleCiDetectorSync', () => {
  describe('undefined values', () => {
    beforeEach(() => {
      vi.unstubAllEnvs()
      vi.stubEnv('CIRCLECI', undefined)
      vi.stubEnv('CIRCLE_BRANCH', undefined)
      vi.stubEnv('CIRCLE_JOB', undefined)
      vi.stubEnv('CIRCLE_NODE_INDEX', undefined)
      vi.stubEnv('CIRCLE_BUILD_URL', undefined)
      vi.stubEnv('CIRCLE_BUILD_NUM', undefined)
      vi.stubEnv('CIRCLE_SHA1', undefined)
      vi.stubEnv('CIRCLE_PR_NUMBER', undefined)
    })

    describe('detect', () => {
      it('returns an empty resource', () => {
        const resource = circleCiDetectorSync.detect()

        expect(resource.attributes).toEqual({})
      })
    })
  })

  describe('defined values', () => {
    beforeEach(() => {
      vi.unstubAllEnvs()
      vi.stubEnv('CIRCLECI', 'circleCi')
      vi.stubEnv('CIRCLE_BRANCH', 'circleBranch')
      vi.stubEnv('CIRCLE_JOB', 'circleJob')
      vi.stubEnv('CIRCLE_NODE_INDEX', 'circleNodeIndex')
      vi.stubEnv('CIRCLE_BUILD_URL', 'circleBuildUrl')
      vi.stubEnv('CIRCLE_BUILD_NUM', 'circleBuildNum')
      vi.stubEnv('CIRCLE_SHA1', 'circleSha1')
      vi.stubEnv('CIRCLE_PR_NUMBER', 'circlePrNumber')
    })

    describe('detect', () => {
      it('returns a resource with attributes', () => {
        const resource = circleCiDetectorSync.detect()

        expect(resource.attributes['ci.circle']).toEqual('circleCi')
        expect(resource.attributes['ci.branch']).toEqual('circleBranch')
        expect(resource.attributes['ci.job']).toEqual('circleJob')
        expect(resource.attributes['ci.node']).toEqual('circleNodeIndex')
        expect(resource.attributes['ci.build-url']).toEqual('circleBuildUrl')
        expect(resource.attributes['ci.build-number']).toEqual('circleBuildNum')
        expect(resource.attributes['SHA1']).toEqual('circleSha1')
        expect(resource.attributes['ci.pr-number']).toEqual('circlePrNumber')
      })
    })
  })
})
