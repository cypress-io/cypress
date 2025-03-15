const { expect } = require('chai')
const { _checkCanaries } = require('../circle-env')

describe('circle-env', () => {
  let cachedEnv = { ...process.env }

  afterEach(() => {
    process.env = cachedEnv
  })

  beforeEach(() => {
    process.env = { CI: 'true' }
  })

  context('with missing canaries', () => {
    context('internal PR', () => {
      it('fails when neither canary is set', () => {
        expect(() => _checkCanaries({ isContributorPR: false })).to.throw('Missing MAIN_CANARY')
      })

      it('fails when only MAIN_CANARY is set', () => {
        process.env.MAIN_CANARY = 'true'

        expect(() => _checkCanaries({ isContributorPR: false })).to.throw('Missing CONTEXT_CANARY')
      })

      it('fails when only CONTEXT_CANARY is set', () => {
        process.env.CONTEXT_CANARY = 'true'

        expect(() => _checkCanaries({ isContributorPR: false })).to.throw('Missing MAIN_CANARY')
      })
    })

    context('contributor PR', () => {
      it('fails when MAIN_CANARY is set', () => {
        process.env.MAIN_CANARY = 'true'

        expect(() => _checkCanaries({ isContributorPR: true })).to.throw('MAIN_CANARY should not be present in a contributor PR.')
      })

      it('fails when CONTEXT_CANARY is set', () => {
        process.env.CONTEXT_CANARY = 'true'

        expect(() => _checkCanaries({ isContributorPR: true })).to.throw('CONTEXT_CANARY should not be present in a contributor PR.')
      })
    })
  })

  it('passes with canaries', () => {
    process.env.MAIN_CANARY = 'true'
    process.env.CONTEXT_CANARY = 'true'

    _checkCanaries({ isContributorPR: false })
  })

  it('passes for contributor PR', () => {
    _checkCanaries({ isContributorPR: true })
  })
})
