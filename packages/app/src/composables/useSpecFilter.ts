import { useSpecStore } from '../store'
import { useMutation, gql } from '@urql/vue'
import { SpecsList_SetSpecFilterDocument } from '@packages/app/src/generated/graphql'
import { ref, watch } from 'vue'
import { useDebounce } from '@vueuse/core'

gql`
mutation SpecsList_SetSpecFilter($specFilter: String!) {
  setSpecFilter(specFilter: $specFilter)
}
`

export function useSpecFilter (savedFilter?: string) {
  const specStore = useSpecStore()
  const saveSpecFilter = useMutation(SpecsList_SetSpecFilterDocument)

  // prefer a filter from client side store, saved filter in gql can be stale
  // and is only used to set the value in the store on first load
  const initialFilter = specStore.specFilter ?? savedFilter ?? ''
  const specFilterModel = ref(initialFilter)

  const debouncedSpecFilterModel = useDebounce(specFilterModel, 200)

  function setSpecFilter (specFilter: string) {
    if (specStore.specFilter !== specFilter) {
      specStore.setSpecFilter(specFilter)
      saveSpecFilter.executeMutation({ specFilter })
    }
  }

  watch(() => debouncedSpecFilterModel?.value, (newVal) => {
    setSpecFilter(newVal ?? '')
  })

  // initialize spec filter in store
  setSpecFilter(specFilterModel.value)

  return {
    specFilterModel,
    debouncedSpecFilterModel,
  }
}
