import type { RunnerUiState } from '../store'
import { useRunnerUiStore } from '../store'
import { useMutation, gql } from '@urql/vue'
import { Preferences_SetPreferencesDocument } from '../generated/graphql'

gql`
mutation Preferences_SetPreferences ($value: String!) {
  setPreferences (value: $value, type: global) {
    ...TestingPreferences
    ...SpecRunner_Preferences
  }
}`

export function usePreferences () {
  const runnerUiStore = useRunnerUiStore()
  const setPreferences = useMutation(Preferences_SetPreferencesDocument)

  async function update<K extends keyof RunnerUiState> (preference: K, value: RunnerUiState[K]) {
    if (runnerUiStore[preference] !== value) {
      // only set the value and trigger the mutation if the value has actually changed
      runnerUiStore.setPreference(preference, value)
      await setPreferences.executeMutation({ value: JSON.stringify({ [preference]: value }) })
    }
  }

  return {
    update,
  }
}
