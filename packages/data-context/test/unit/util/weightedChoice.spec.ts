import { describe, expect, it } from '@jest/globals'

import { WEIGHTED, WEIGHTED_EVEN } from '../../../src/util/weightedChoice'

describe('weightedChoice', () => {
  describe('WeightedAlgorithm', () => {
    it('should error if invalid arguments', () => {
      const weights = [25, 75, 45]
      const options = ['A', 'B']

      const func = () => {
        WEIGHTED(weights).pick(options)
      }

      expect(func).toThrow()
    })

    it('should error if weights is empty', () => {
      const weights = []
      const options = ['A', 'B']

      const func = () => {
        WEIGHTED(weights).pick(options)
      }

      expect(func).toThrow()
    })

    it('should error if options is empty', () => {
      const weights = [25, 75, 45]
      const options = []

      const func = () => {
        WEIGHTED(weights).pick(options)
      }

      expect(func).toThrow()
    })

    it('should return an option', () => {
      const weights = [25, 75]
      const options = ['A', 'B']
      const selected = WEIGHTED(weights).pick(options)

      expect(options.includes(selected)).toBe(true)
    })
  })

  describe('WEIGHTED_EVEN', () => {
    it('should return an option', () => {
      const options = ['A', 'B']
      const selected = WEIGHTED_EVEN(options).pick(options)

      expect(options.includes(selected)).toBe(true)
    })
  })

  describe('randomness', () => {
    it('should return values close to supplied weights', () => {
      const results = {}
      const options = ['A', 'B']
      const algorithm = WEIGHTED_EVEN(options)

      for (let i = 0; i < 1000; i++) {
        const selected = algorithm.pick(options)

        results[selected] ? results[selected]++ : results[selected] = 1
      }

      Object.keys(results).forEach((key) => {
        expect(Math.round(results[key] / 100)).toEqual(5)
      })
    })
  })
})
