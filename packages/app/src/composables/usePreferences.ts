import { useRunnerUiStore, RunnerUiState } from '../store'
import { useMutation, gql } from '@urql/vue'
import { Preferences_SetPreferencesDocument } from '@packages/data-context/src/gen/all-operations.gen'

const runnerUiStore = useRunnerUiStore()

gql`
mutation Preferences_SetPreferences ($value: String!) {
  setPreferences (value: $value)
}`

export function usePreferences () {
  const setPreferences = useMutation(Preferences_SetPreferencesDocument)

  function update<K extends keyof RunnerUiState> (preference: K, value: RunnerUiState[K]) {
    if (runnerUiStore[preference] !== value) {
      // only set the value and trigger the mutation if the value has actually changed
      runnerUiStore.setPreference(preference, value)
      setPreferences.executeMutation({ value: JSON.stringify({ [preference]: value }) })
    }
  }

  return {
    update,
  }
}
