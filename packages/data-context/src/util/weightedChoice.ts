import _ from 'lodash'

type WeightedAlgorithm = {
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

  // `?? 0` rather than a falsy check on the previous total: a weight of 0 is a
  // valid instruction never to pick that value, so it must extend the array
  // like any other weight instead of ending it.
  const cumulativeWeights = weights.reduce<number[]>((acc, curr) => {
    return [...acc, (acc[acc.length - 1] ?? 0) + curr]
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
