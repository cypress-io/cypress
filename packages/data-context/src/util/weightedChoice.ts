import _ from 'lodash'

export type WeightedAlgorithm = {
  pick: (values: string[]) => string
}

/**
 * Randomly choose an index from an array based on weights
 *
 * Based on algorithm found here: https://dev.to/trekhleb/weighted-random-algorithm-in-javascript-1pdc
 *
 * @param weights array of numbered weights that correspond to the indexed values
 * @param values array of values to choose from
 */
const weightedChoice = (weights: number[], values: any[]) => {
  if (weights.length === 0 || values.length === 0 || weights.length !== values.length) {
    throw new Error('The length of the weights and values must be the same and greater than zero')
  }

  const cumulativeWeights = weights.reduce<number[]>((acc, curr) => {
    if (acc.length === 0) {
      return [curr]
    }

    const last = acc[acc.length - 1]

    if (!last) {
      return acc
    }

    return [...acc, last + curr]
  }, [])

  const randomNumber = Math.random() * (cumulativeWeights[cumulativeWeights.length - 1] ?? 1)

  const choice = _.transform(cumulativeWeights, (result, value, index) => {
    if (value >= randomNumber) {
      result.chosenIndex = index
    }

    return result.chosenIndex === -1
  }, { chosenIndex: -1 })

  return values[choice.chosenIndex]
}

export const WEIGHTED = (weights: number[]): WeightedAlgorithm => {
  return {
    pick: (values: any[]): string => {
      return weightedChoice(weights, values)
    },
  }
}

export const WEIGHTED_EVEN = (values: any[]): WeightedAlgorithm => {
  return WEIGHTED(_.fill(Array(values.length), 1))
}
