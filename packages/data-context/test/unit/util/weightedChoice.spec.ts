import { describe, expect, it, jest } from '@jest/globals'

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
    // Sweeping `Math.random` across the unit interval makes the split exact.
    // Sampling it instead only pins the split to within a few standard
    // deviations of the weights, which flakes at CI volume.
    const tally = (algorithm: { pick: (values: string[]) => string }, options: string[], draws = 1000) => {
      const random = jest.spyOn(Math, 'random')
      const results: Record<string, number> = Object.fromEntries(options.map((option) => [option, 0]))

      try {
        for (let i = 0; i < draws; i++) {
          // Bucket midpoints, so no draw lands on the inclusive boundary
          // between two adjacent weight ranges
          random.mockReturnValue((i + 0.5) / draws)
          results[algorithm.pick(options)]++
        }
      } finally {
        random.mockRestore()
      }

      return results
    }

    it('should return each option in proportion to its weight', () => {
      expect(tally(WEIGHTED([20, 30, 50]), ['A', 'B', 'C'])).toEqual({ A: 200, B: 300, C: 500 })
    })

    it('should return an even split when weights are equal', () => {
      expect(tally(WEIGHTED_EVEN(['A', 'B']), ['A', 'B'])).toEqual({ A: 500, B: 500 })
    })

    it('should never return a value weighted zero', () => {
      expect(tally(WEIGHTED([0, 1]), ['A', 'B'])).toEqual({ A: 0, B: 1000 })
      expect(tally(WEIGHTED([50, 0, 50]), ['A', 'B', 'C'])).toEqual({ A: 500, B: 0, C: 500 })
      expect(tally(WEIGHTED([0, 0, 1]), ['A', 'B', 'C'])).toEqual({ A: 0, B: 0, C: 1000 })
    })
  })
})
