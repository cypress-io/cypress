import { useMutation, gql } from '@urql/vue'
import { UseCohorts_DetermineCohortDocument } from '../../generated/graphql'
import { ref } from 'vue'

gql`
mutation UseCohorts_DetermineCohort ($name: String!, $cohorts: [String!]!) {
  determineCohort(cohortConfig: { name: $name, cohorts: $cohorts } ) {
    __typename
    name
    cohort
  }
}`

/**
 * An option to use for a given cohort selection.
 */
export type CohortOption = {
  /** The individual cohort identifier.  Example: 'A' or 'B' */
  cohort: string

  /** The value to be used by the calling code for the given cohort. The algorithm for selecting the cohort does not care about this value, but it will return the entire CohortOption that is selected so that this value can be used by the calling code. */
  value: any
}

/**
 * The configuration of the cohort to be used to select a cohort.
 */
export type CohortConfig = {
  /** The name of the feature the cohort will be calculated for.  This will be used as a key in the cache file for storing the selected option. */
  name: string

  /** Array of options to pick from when selecting the cohort */
  options: CohortOption[]

  /** Optional array of weights to use for selecting the cohort.  If not supplied, an even weighting algorithm will be used. */
  weights?: number[]
}

/**
 * Composable that encapsulates the logic for choosing a cohort from a list of configured options.
 *
 * @remarks
 * The logic for this composable will first check the cache file to determine if a cohort has already been saved for the given cohort `name`. If found, that cohort will be returned.  If not found or the option found does not match an existing option, a weighted algorithm will be used to pick from the list of CohortOptions. The picked value will be stored in the cache and returned.
 *
 * @returns object with getCohort function for returning the cohort
 */
export const useCohorts = () => {
  const determineCohortMutation = useMutation(UseCohorts_DetermineCohortDocument)

  const determineCohort = async (name: string, cohorts: string[]) => {
    return await determineCohortMutation.executeMutation({
      name,
      cohorts,
    })
  }

  /**
   * Return the cohort from the list of configured options
   *
   * @param config - cohort configuration that contains the options to choose from and optionally the algorithm to use.  Defaults to using the WEIGHTED_EVEN algorithm
   *
   * @returns a reactive reference to the cohort option that is selected
   */
  const getCohort = (config: CohortConfig) => {
    const cohortOptionSelected = ref<CohortOption>()

    const { name, options } = config

    // If an experiment has been ended it will have <= 1 cohort option. In this case, bypass selecting & persisting a cohort
    if (!options || options.length <= 1) {
      cohortOptionSelected.value = options?.[0]
    } else {
      const cohortIds = options.map((option) => option.cohort)

      const fetchCohort = async () => {
        const cohortSelected = await determineCohort(name, cohortIds)

        cohortOptionSelected.value = options.find((option) => option.cohort === cohortSelected.data?.determineCohort?.cohort)
      }

      // tslint:disable:no-floating-promises
      fetchCohort()
    }

    return cohortOptionSelected
  }

  return {
    getCohort,
  }
}
