import { gql, useMutation } from '@urql/vue'
import { UsePromptManager_SetPreferencesDocument } from '../../generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { isAllowedFeature } from '../../utils/isAllowedFeature'

gql`
mutation UsePromptManager_SetPreferences($value: String!) {
  setPreferences(type: project, value: $value) {
    currentProject {
      id
      savedState
    }
  }
}
`

gql`
query UsePromptManager_RefreshProject {
  currentProject {
    id
    savedState
  }
}
`

export function usePromptManager () {
  const setPreferencesMutation = useMutation(UsePromptManager_SetPreferencesDocument)
  const loginConnectStore = useLoginConnectStore()

  function setPromptShown (slug) {
    setPreferencesMutation.executeMutation({ value: JSON.stringify({ promptsShown: { [slug]: Date.now() } }) })
  }

  const wrappedIsAllowedFeature = (featureName: 'specsListBanner' | 'docsCiPrompt') => {
    return isAllowedFeature(featureName, loginConnectStore)
  }

  return {
    setPromptShown,
    isAllowedFeature: wrappedIsAllowedFeature,
  }
}
