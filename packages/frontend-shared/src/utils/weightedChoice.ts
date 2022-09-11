import _ from 'lodash'

export type WeightedAlgorithm = {
  pick: Function
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
  if (weights.length !== values.length) {
    throw new Error('The length of the weights and values must be the same')
  }

  const cumulativeWeights = _.reduce(weights, (result: number[], value: number) => {
    if (result.length === 0) {
      result.push(value)
    } else {
      result.push(value + result[result.length - 1])
    }

    return result
  }, [])

  const randomNumber = Math.random() * cumulativeWeights[cumulativeWeights.length - 1]

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
