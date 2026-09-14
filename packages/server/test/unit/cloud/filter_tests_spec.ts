import '../../spec_helper'
import { expect } from 'chai'

import { getEligibleTestTitles } from '../../../lib/cloud/filter_tests'

const filterAction = (payload) => {
  return {
    action: 'FILTER',
    clientId: null,
    type: 'SPEC',
    payload: {
      filter: ['failed', 'skipped', 'newOrModified'],
      message: null,
      anchorBuildId: 123,
      ...payload,
    },
  }
}

describe('lib/cloud/filter_tests', () => {
  describe('.getEligibleTestTitles', () => {
    it('returns undefined when there is no FILTER action', () => {
      expect(getEligibleTestTitles(undefined)).to.be.undefined
      expect(getEligibleTestTitles(null)).to.be.undefined
      expect(getEligibleTestTitles([])).to.be.undefined
      expect(getEligibleTestTitles([
        { action: 'SKIP', type: 'SPEC', clientId: null, payload: null },
        { action: 'MUTE', type: 'TEST', clientId: 'a', payload: null },
      ])).to.be.undefined
    })

    it('returns the full titles of tests whose status is in the filter', () => {
      const actions = [filterAction({
        filter: ['failed', 'skipped', 'newOrModified'],
        tests: [
          { titleHash: 'h1', titleParts: ['suite', 'a fails'], status: 'failed', message: null },
          { titleHash: 'h2', titleParts: ['suite', 'b passes'], status: 'passed', message: null },
          { titleHash: 'h3', titleParts: ['suite', 'c flaky'], status: 'flaky', message: null },
          { titleHash: 'h4', titleParts: ['suite', 'd skipped'], status: 'skipped', message: null },
          { titleHash: 'h5', titleParts: ['suite', 'e new'], status: 'newOrModified', message: null },
        ],
      })]

      // passing + flaky-passing are excluded (they are not in the keep-list)
      expect(getEligibleTestTitles(actions)).to.deep.equal([
        'suite a fails',
        'suite d skipped',
        'suite e new',
      ])
    })

    it('joins titleParts into a full title with spaces', () => {
      const actions = [filterAction({
        filter: ['failed'],
        tests: [
          { titleHash: 'h1', titleParts: ['outer', 'inner', 'the test'], status: 'failed', message: null },
        ],
      })]

      expect(getEligibleTestTitles(actions)).to.deep.equal(['outer inner the test'])
    })

    it('strips the "(skipped due to browser)" suffix so titles match the runner', () => {
      const actions = [filterAction({
        filter: ['failed'],
        tests: [
          { titleHash: 'h1', titleParts: ['suite', 'a test (skipped due to browser)'], status: 'failed', message: null },
        ],
      })]

      expect(getEligibleTestTitles(actions)).to.deep.equal(['suite a test'])
    })

    it('returns an empty array when a FILTER action has no eligible tests', () => {
      const actions = [filterAction({
        filter: ['failed'],
        tests: [
          { titleHash: 'h1', titleParts: ['suite', 'a passes'], status: 'passed', message: null },
        ],
      })]

      expect(getEligibleTestTitles(actions)).to.deep.equal([])
    })

    it('ignores non-FILTER actions alongside a FILTER action', () => {
      const actions = [
        { action: 'SKIP', type: 'SPEC', clientId: null, payload: null },
        filterAction({
          filter: ['failed'],
          tests: [
            { titleHash: 'h1', titleParts: ['suite', 'a fails'], status: 'failed', message: null },
          ],
        }),
      ]

      expect(getEligibleTestTitles(actions)).to.deep.equal(['suite a fails'])
    })
  })
})
