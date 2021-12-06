import { useRunnerUiStore } from '../store'
import { useMutation, gql } from '@urql/vue'
import { Preferences_SetPreferencesDocument } from '@packages/data-context/src/gen/all-operations.gen'

const runnerUiStore = useRunnerUiStore()

gql`
mutation Preferences_SetPreferences ($value: String!) {
  setPreferences (value: $value)
}`

export function usePreferences () {
  const setPreferences = useMutation(Preferences_SetPreferencesDocument)

  function update (preference: 'autoScrollingEnabled' | 'isSpecsListOpen', value: any) {
    runnerUiStore.setPreference(preference, value)
    setPreferences.executeMutation({ value: JSON.stringify({ [preference]: value }) })
  }

  return {
    update,
  }
}
