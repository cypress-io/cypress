import { expect } from 'chai'

import { githubActionsDetectorSync } from '../../src/detectors/githubActionsDetectorSync'

describe('githubActionsDetectorSync', () => {
  describe('undefined values', () => {
    const processValues: any = {}

    beforeEach(() => {
      // cache values
      processValues.GITHUB_ACTION = process.env.GITHUB_ACTION
      processValues.GH_BRANCH = process.env.GH_BRANCH
      processValues.GITHUB_HEAD_REF = process.env.GITHUB_HEAD_REF
      processValues.GITHUB_REF_NAME = process.env.GITHUB_REF_NAME
      processValues.GITHUB_RUN_NUMBER = process.env.GITHUB_RUN_NUMBER
      processValues.GITHUB_SHA = process.env.GITHUB_SHA

      //reset values
      delete process.env.GITHUB_ACTION
      delete process.env.GH_BRANCH
      delete process.env.GITHUB_HEAD_REF
      delete process.env.GITHUB_REF_NAME
      delete process.env.GITHUB_RUN_NUMBER
      delete process.env.GITHUB_SHA
    })

    afterEach(() => {
      // Replace values
      process.env.GITHUB_ACTION = processValues.GITHUB_ACTION
      process.env.GH_BRANCH = processValues.GH_BRANCH
      process.env.GITHUB_HEAD_REF = processValues.GITHUB_HEAD_REF
      process.env.GITHUB_REF_NAME = processValues.GITHUB_REF_NAME
      process.env.GITHUB_RUN_NUMBER = processValues.GITHUB_RUN_NUMBER
      process.env.GITHUB_SHA = processValues.GITHUB_SHA
    })

    describe('detect', () => {
      it('returns an empty resource', () => {
        const resource = githubActionsDetectorSync.detect()

        expect(resource.attributes).to.be.empty
      })
    })
  })

  describe('defined values', () => {
    const processValues: any = {}

    beforeEach(() => {
      // cache values
      processValues.GITHUB_ACTION = process.env.GITHUB_ACTION
      processValues.GH_BRANCH = process.env.GH_BRANCH
      processValues.GITHUB_HEAD_REF = process.env.GITHUB_HEAD_REF
      processValues.GITHUB_REF_NAME = process.env.GITHUB_REF_NAME
      processValues.GITHUB_RUN_NUMBER = process.env.GITHUB_RUN_NUMBER
      processValues.GITHUB_SHA = process.env.GITHUB_SHA

      //reset values
      process.env.GITHUB_ACTION = 'githubAction'
      process.env.GH_BRANCH = 'ghBranch'
      process.env.GITHUB_HEAD_REF = 'ghHeadRef'
      process.env.GITHUB_REF_NAME = 'ghRefName'
      process.env.GITHUB_RUN_NUMBER = 'ghRunNumber'
      process.env.GITHUB_SHA = 'ghSha'
    })

    afterEach(() => {
      // Replace values
      process.env.GITHUB_ACTION = processValues.GITHUB_ACTION
      process.env.GH_BRANCH = processValues.GH_BRANCH
      process.env.GITHUB_HEAD_REF = processValues.GITHUB_HEAD_REF
      process.env.GITHUB_REF_NAME = processValues.GITHUB_REF_NAME
      process.env.GITHUB_RUN_NUMBER = processValues.GITHUB_RUN_NUMBER
      process.env.GITHUB_SHA = processValues.GITHUB_SHA
    })

    describe('detect', () => {
      it('returns a resource with attributes', () => {
        const resource = githubActionsDetectorSync.detect()

        expect(resource.attributes['ci.github_action']).to.equal('githubAction')
        expect(resource.attributes['ci.branch']).to.equal('ghBranch')
        expect(resource.attributes['ci.build-number']).to.equal('ghRunNumber')
        expect(resource.attributes['SHA1']).to.equal('ghSha')
      })

      it('returns a resource with attributes when GH_BRANCH is missing', () => {
        delete process.env.GH_BRANCH

        const resource = githubActionsDetectorSync.detect()

        expect(resource.attributes['ci.github_action']).to.equal('githubAction')
        expect(resource.attributes['ci.branch']).to.equal('ghHeadRef')
        expect(resource.attributes['ci.build-number']).to.equal('ghRunNumber')
        expect(resource.attributes['SHA1']).to.equal('ghSha')
      })

      it('returns a resource with attributes when GH_BRANCH and GITHUB_HEAD_REF is missing', () => {
        delete process.env.GH_BRANCH
        delete process.env.GITHUB_HEAD_REF

        const resource = githubActionsDetectorSync.detect()

        expect(resource.attributes['ci.github_action']).to.equal('githubAction')
        expect(resource.attributes['ci.branch']).to.equal('ghRefName')
        expect(resource.attributes['ci.build-number']).to.equal('ghRunNumber')
        expect(resource.attributes['SHA1']).to.equal('ghSha')
      })
    })
  })
})
