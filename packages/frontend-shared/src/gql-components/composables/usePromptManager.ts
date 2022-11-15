import { gql, useMutation } from '@urql/vue'
import { UsePromptManager_SetProjectPreferencesDocument, UsePromptManager_SetGlobalPreferencesDocument } from '../../generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { isAllowedFeature } from '../../utils/isAllowedFeature'

gql`
mutation UsePromptManager_SetProjectPreferences($value: String!) {
  setPreferences(type: project, value: $value) {
    currentProject {
      id
      savedState
    }
  }
}
`

gql`
mutation UsePromptManager_SetGlobalPreferences($value: String!) {
  setPreferences(type: global, value: $value) {
    localSettings {
      preferences {
        majorVersionWelcomeDismissed
      }
    }
  }
}
`

export function usePromptManager () {
  const setProjectPreferencesMutation = useMutation(UsePromptManager_SetProjectPreferencesDocument)
  const setGlobalPreferencesMutation = useMutation(UsePromptManager_SetGlobalPreferencesDocument)
  const loginConnectStore = useLoginConnectStore()

  // TODO: get Nav CI prompts using this in #23768 and retire the old setPromptShown mutation
  function setPromptShown (slug: 'ci1' | 'orchestration1' | 'loginModalRecord') {
    return setProjectPreferencesMutation.executeMutation({ value: JSON.stringify({ promptsShown: { [slug]: Date.now() } }) })
  }

  function setMajorVersionWelcomeDismissed (majorVersion: string) {
    return setGlobalPreferencesMutation.executeMutation({ value: JSON.stringify({ majorVersionWelcomeDismissed: { [majorVersion]: Date.now() } }) })
  }

  const wrappedIsAllowedFeature = (featureName: 'specsListBanner' | 'docsCiPrompt') => {
    return isAllowedFeature(featureName, loginConnectStore)
  }

  return {
    setPromptShown,
    isAllowedFeature: wrappedIsAllowedFeature,
    setMajorVersionWelcomeDismissed,
  }
}
