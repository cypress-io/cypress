import _ from 'lodash'
import { useMutation, gql, useQuery } from '@urql/vue'
import { WeightedAlgorithm, WEIGHTED_EVEN } from '../utils/weightedChoice'
import { UseCohorts_GetCohortDocument, UseCohorts_InsertCohortDocument } from '../generated/graphql'

gql`
query UseCohorts_GetCohort($name: String!) {
  cohort(name: $name) {
    name
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

  function getCohortFromCache (name: string): string | null | undefined {
    const result = useQuery({
      query: UseCohorts_GetCohortDocument,
      variables: { name },
    })

    return result.data?.value?.cohort?.name
  }

  function setCohortInCache (name: string, cohortSelected: string) {
    insertCohortMutation.executeMutation({
      name,
      cohort: cohortSelected,
    })
  }

  let cohortSelected: string

  const cohortFromCache = getCohortFromCache(config.name)

  if (!cohortFromCache || !_.includes(config.cohorts, cohortFromCache)) {
    const algorithm = config.algorithm || WEIGHTED_EVEN(config.cohorts)

    cohortSelected = algorithm.pick(config.cohorts)
    setCohortInCache(config.name, cohortSelected)
  } else {
    cohortSelected = cohortFromCache
  }

  const get = (): Cohort => {
    return {
      id: cohortSelected,
    }
  }

  return {
    get,
  }
}
