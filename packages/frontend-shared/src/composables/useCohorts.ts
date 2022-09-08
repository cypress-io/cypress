import _ from 'lodash'
import { useMutation, gql, useQuery } from '@urql/vue'
import { WeightedAlgorithm, WEIGHTED_EVEN } from '../utils/weightedChoice'
import { UseCohorts_GetCohortDocument, UseCohorts_InsertCohortDocument } from '../generated/graphql'

gql`
query UseCohorts_GetCohort($id: String!) {
  cohort(id: $id) {
    id
  }
}
`

gql`
mutation UseCohorts_InsertCohort ($id: String!, $name: String!) {
  insertCohort (id: $id, name: $name)
}`

export type CohortConfig = {
  id: string
  cohorts: string[]
  algorithm?: WeightedAlgorithm
}

export type Cohort = {
  id: string
}

export const useCohorts = (config: CohortConfig) => {
  const insertCohortMutation = useMutation(UseCohorts_InsertCohortDocument)

  function getCohortFromCache (id: string): string | null | undefined {
    const result = useQuery({
      query: UseCohorts_GetCohortDocument,
      variables: { id },
    })

    return result.data?.value?.cohort?.id
  }

  function setCohortInCache (id: string, cohortSelected: string) {
    insertCohortMutation.executeMutation({
      id,
      name: cohortSelected,
    })
  }

  let cohortSelected: string

  const cohortFromCache = getCohortFromCache(config.id)

  if (!cohortFromCache || !_.includes(config.cohorts, cohortFromCache)) {
    const algorithm = config.algorithm || WEIGHTED_EVEN(config.cohorts)

    cohortSelected = algorithm.pick(config.cohorts)
    setCohortInCache(config.id, cohortSelected)
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
