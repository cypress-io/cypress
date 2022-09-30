import { gql, useMutation } from '@urql/vue'
import { LoginConnect_SetPromptShownDocument } from '../generated/graphql'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { isAllowedFeature } from '../utils/isAllowedFeature'

gql`
mutation LoginConnect_SetPromptShown($slug: String!) {
  setPromptShown(slug: $slug)
}
`

/**
 *
 * @param eventTime
 * @param waitTime "1 day", "20 minutes", etc - will be parsed by human-interval package
 * @returns
 */

export function usePromptManager () {
  const setPromptShownMutation = useMutation(LoginConnect_SetPromptShownDocument)
  const loginConnectStore = useLoginConnectStore()

  function setPromptShown (slug) {
    setPromptShownMutation.executeMutation({ slug })
  }

  const wrappedIsAllowedFeature = (featureName: 'specsListBanner' | 'docsCiPrompt') => {
    return isAllowedFeature(featureName, loginConnectStore)
  }

  return {
    setPromptShown,
    isAllowedFeature: wrappedIsAllowedFeature,
  }
}
