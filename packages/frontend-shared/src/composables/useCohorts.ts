import _ from 'lodash'
import { useMutation, gql, useQuery } from '@urql/vue'
import { WeightedAlgorithm, WEIGHTED_EVEN } from '../utils/weightedChoice'
import { UseCohorts_GetCohortDocument, UseCohorts_InsertCohortDocument } from '../generated/graphql'
import { ref } from 'vue'

gql`
query UseCohorts_GetCohort($name: String!) {
  cohort(name: $name) {
    name
    cohort
  }
}
`

gql`
mutation UseCohorts_InsertCohort ($name: String!, $cohort: String!) {
  insertCohort (name: $name, cohort: $cohort)
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

  /** Optional weighted algorithm to use for selecting the cohort.  If not supplied, the WEIGHTED_EVEN algorithm will be used. */
  algorithm?: WeightedAlgorithm
}

/**
 * Composable that encapsulates the logic for choosing a cohort from a list of configured options.
 *
 * @remarks
 * The logic for this composable will first check the cache file to determine if a cohort has already been saved for the given cohort `name`. If found, that cohort will be returned.  If not found or the option found does not match an existing option, a weighted algorithm will be used to pick from the list of CohortOptions. The picked value will be stored in the cache and returned.
 *
 * @param config - cohort configuration that contains the options to choose from and optionally the algorithm to use.  Defaults to using the WEIGHTED_EVEN algorithm
 * @returns a reactive reference to the cohort option that is selected
 */
export const useCohorts = (config: CohortConfig) => {
  const insertCohortMutation = useMutation(UseCohorts_InsertCohortDocument)

  const getCohortFromCache = async (name: string) => {
    const getCohortQuery = useQuery({
      query: UseCohorts_GetCohortDocument,
      variables: { name },
    })

    await getCohortQuery.executeQuery()

    return getCohortQuery.data?.value?.cohort?.cohort
  }

  const setCohortInCache = async (name: string, cohortSelected: string) => {
    return await insertCohortMutation.executeMutation({
      name,
      cohort: cohortSelected,
    })
  }

  const cohortOptionSelected = ref<CohortOption | undefined>()

  const cohortIds = config.options.map((option) => option.cohort)

  const fetchCohort = async () => {
    const cohortFromCache = await getCohortFromCache(config.name)

    let cohortSelected: string

    if (!cohortFromCache || !_.includes(cohortIds, cohortFromCache)) {
      const algorithm = config.algorithm || WEIGHTED_EVEN(cohortIds)

      const pickedCohort = algorithm.pick(cohortIds)

      setCohortInCache(config.name, pickedCohort)
      cohortSelected = pickedCohort
    } else {
      cohortSelected = cohortFromCache
    }

    cohortOptionSelected.value = config.options.find((option) => option.cohort === cohortSelected)
  }

  fetchCohort()

  return cohortOptionSelected
}
