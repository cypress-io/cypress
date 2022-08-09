import { useSpecStore } from '../store'
import { useMutation, gql } from '@urql/vue'
import { ref, watch } from 'vue'
import { useDebounce } from '@vueuse/core'
import { SpecFilter_SetPreferencesDocument } from '@packages/app/src/generated/graphql'

gql`
mutation SpecFilter_SetPreferences ($value: String!) {
  setPreferences (value: $value, type: project) {
    ...TestingPreferences
    ...SpecRunner_Preferences
  }
}`

export function useSpecFilter (savedFilter?: string) {
  const specStore = useSpecStore()
  const saveSpecFilter = useMutation(SpecFilter_SetPreferencesDocument)

  // prefer a filter from client side store, saved filter in gql can be stale
  // and is only used to set the value in the store on first load
  const initialFilter = specStore.specFilter ?? savedFilter ?? ''
  const specFilterModel = ref(initialFilter)

  const debouncedSpecFilterModel = useDebounce(specFilterModel, 200)

  function setSpecFilter (specFilter: string) {
    if (specStore.specFilter !== specFilter) {
      specStore.setSpecFilter(specFilter)
      saveSpecFilter.executeMutation({ value: JSON.stringify({ specFilter }) })
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
