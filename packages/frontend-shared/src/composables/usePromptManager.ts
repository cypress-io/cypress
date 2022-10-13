import { gql, useMutation, useQuery } from '@urql/vue'
import { UsePromptManager_RefreshProjectDocument, UsePromptManager_SetPromptShownDocument } from '../generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { isAllowedFeature } from '../utils/isAllowedFeature'

gql`
mutation UsePromptManager_SetPromptShown($slug: String!) {
  setPromptShown(slug: $slug)
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
  const setPromptShownMutation = useMutation(UsePromptManager_SetPromptShownDocument)
  const refreshProjectQuery = useQuery({ query: UsePromptManager_RefreshProjectDocument, pause: true })
  const loginConnectStore = useLoginConnectStore()

  function setPromptShown (slug) {
    setPromptShownMutation.executeMutation({ slug }).then((result) => {
      //TODO Can the mutation be modified to cause the responsive values for CurrentProject to update
      //instead of having to execute this separate query?
      refreshProjectQuery.executeQuery({ requestPolicy: 'network-only' })
    })
  }

  const wrappedIsAllowedFeature = (featureName: 'specsListBanner' | 'docsCiPrompt') => {
    return isAllowedFeature(featureName, loginConnectStore)
  }

  return {
    setPromptShown,
    isAllowedFeature: wrappedIsAllowedFeature,
  }
}
