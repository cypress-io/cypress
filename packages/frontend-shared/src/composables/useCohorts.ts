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

export type CohortConfig = {
  name: string
  cohorts: string[]
  algorithm?: WeightedAlgorithm
}

export type Cohort = {
  id: string
}

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

  const cohortSelected = ref<string>()

  const fetchCohort = async () => {
    const cohortFromCache = await getCohortFromCache(config.name)

    if (!cohortFromCache || !_.includes(config.cohorts, cohortFromCache)) {
      const algorithm = config.algorithm || WEIGHTED_EVEN(config.cohorts)

      const pickedCohort = algorithm.pick(config.cohorts)

      setCohortInCache(config.name, pickedCohort)
      cohortSelected.value = pickedCohort
    } else {
      cohortSelected.value = cohortFromCache
    }
  }

  fetchCohort()

  return cohortSelected
}
