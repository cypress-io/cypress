import { useSpecStore } from '../store'
import { useMutation, gql } from '@urql/vue'
import { SpecsList_SetSpecFilterDocument } from '@packages/app/src/generated/graphql'

gql`
mutation SpecsList_SetSpecFilter($specFilter: String!) {
  setSpecFilter(specFilter: $specFilter)
}
`

export function useSpecFilter () {
  const specStore = useSpecStore()
  const saveSpecFilter = useMutation(SpecsList_SetSpecFilterDocument)

  function setSpecFilter (specFilter: string) {
    specStore.setSpecFilter(specFilter)
    saveSpecFilter.executeMutation({ specFilter })
  }

  return {
    setSpecFilter,
  }
}
