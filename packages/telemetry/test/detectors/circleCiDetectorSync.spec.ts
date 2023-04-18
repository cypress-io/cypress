import { expect } from 'chai'

import { circleCiDetectorSync } from '../../src/detectors/circleCiDetectorSync'

describe('circleCiDetectorSync', () => {
  describe('undefined values', () => {
    const processValues: any = {}

    beforeEach(() => {
      // cache values
      processValues.CIRCLECI = process.env.CIRCLECI
      processValues.CIRCLE_BRANCH = process.env.CIRCLE_BRANCH
      processValues.CIRCLE_JOB = process.env.CIRCLE_JOB
      processValues.CIRCLE_NODE_INDEX = process.env.CIRCLE_NODE_INDEX
      processValues.CIRCLE_BUILD_URL = process.env.CIRCLE_BUILD_URL
      processValues.CIRCLE_BUILD_NUM = process.env.CIRCLE_BUILD_NUM
      processValues.CIRCLE_SHA1 = process.env.CIRCLE_SHA1
      processValues.CIRCLE_PR_NUMBER = process.env.CIRCLE_PR_NUMBER

      //reset values
      delete process.env.CIRCLECI
      delete process.env.CIRCLE_BRANCH
      delete process.env.CIRCLE_JOB
      delete process.env.CIRCLE_NODE_INDEX
      delete process.env.CIRCLE_BUILD_URL
      delete process.env.CIRCLE_BUILD_NUM
      delete process.env.CIRCLE_SHA1
      delete process.env.CIRCLE_PR_NUMBER
    })

    afterEach(() => {
      // Replace values
      process.env.CIRCLECI = processValues.CIRCLECI
      process.env.CIRCLE_BRANCH = processValues.CIRCLE_BRANCH
      process.env.CIRCLE_JOB = processValues.CIRCLE_JOB
      process.env.CIRCLE_NODE_INDEX = processValues.CIRCLE_NODE_INDEX
      process.env.CIRCLE_BUILD_URL = processValues.CIRCLE_BUILD_URL
      process.env.CIRCLE_BUILD_NUM = processValues.CIRCLE_BUILD_NUM
      process.env.CIRCLE_SHA1 = processValues.CIRCLE_SHA1
      process.env.CIRCLE_PR_NUMBER = processValues.CIRCLE_PR_NUMBER
    })

    describe('detect', () => {
      it('returns an empty resource', () => {
        const resource = circleCiDetectorSync.detect()

        expect(resource.attributes).to.be.empty
      })
    })
  })

  describe('defined values', () => {
    const processValues: any = {}

    beforeEach(() => {
      // cache values
      processValues.CIRCLECI = process.env.CIRCLECI
      processValues.CIRCLE_BRANCH = process.env.CIRCLE_BRANCH
      processValues.CIRCLE_JOB = process.env.CIRCLE_JOB
      processValues.CIRCLE_NODE_INDEX = process.env.CIRCLE_NODE_INDEX
      processValues.CIRCLE_BUILD_URL = process.env.CIRCLE_BUILD_URL
      processValues.CIRCLE_BUILD_NUM = process.env.CIRCLE_BUILD_NUM
      processValues.CIRCLE_SHA1 = process.env.CIRCLE_SHA1
      processValues.CIRCLE_PR_NUMBER = process.env.CIRCLE_PR_NUMBER

      //reset values
      process.env.CIRCLECI = 'circleCi'
      process.env.CIRCLE_BRANCH = 'circleBranch'
      process.env.CIRCLE_JOB = 'circleJob'
      process.env.CIRCLE_NODE_INDEX = 'circleNodeIndex'
      process.env.CIRCLE_BUILD_URL = 'circleBuildUrl'
      process.env.CIRCLE_BUILD_NUM = 'circleBuildNum'
      process.env.CIRCLE_SHA1 = 'circleSha1'
      process.env.CIRCLE_PR_NUMBER = 'circlePrNumber'
    })

    afterEach(() => {
      // Replace values
      process.env.CIRCLECI = processValues.CIRCLECI
      process.env.CIRCLE_BRANCH = processValues.CIRCLE_BRANCH
      process.env.CIRCLE_JOB = processValues.CIRCLE_JOB
      process.env.CIRCLE_NODE_INDEX = processValues.CIRCLE_NODE_INDEX
      process.env.CIRCLE_BUILD_URL = processValues.CIRCLE_BUILD_URL
      process.env.CIRCLE_BUILD_NUM = processValues.CIRCLE_BUILD_NUM
      process.env.CIRCLE_SHA1 = processValues.CIRCLE_SHA1
      process.env.CIRCLE_PR_NUMBER = processValues.CIRCLE_PR_NUMBER
    })

    describe('detect', () => {
      it('returns a resource with attributes', () => {
        const resource = circleCiDetectorSync.detect()

        console.log(resource.attributes)

        expect(resource.attributes['ci.circle']).to.equal('circleCi')
        expect(resource.attributes['ci.branch']).to.equal('circleBranch')
        expect(resource.attributes['ci.job']).to.equal('circleJob')
        expect(resource.attributes['ci.node']).to.equal('circleNodeIndex')
        expect(resource.attributes['ci.build-url']).to.equal('circleBuildUrl')
        expect(resource.attributes['ci.build-number']).to.equal('circleBuildNum')
        expect(resource.attributes['SHA1']).to.equal('circleSha1')
        expect(resource.attributes['ci.pr-number']).to.equal('circlePrNumber')
      })
    })
  })
})
