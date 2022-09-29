import { gql, useMutation } from '@urql/vue'
import { LoginConnect_SetPromptShownDocument } from '../generated/graphql'

gql`
mutation LoginConnect_SetPromptShown($slug: String!) {
  setPromptShown(slug: $slug)
}
`

export function usePromptManager () {
  const setPromptShownMutation = useMutation(LoginConnect_SetPromptShownDocument)

  function setPromptShown (slug) {
    setPromptShownMutation.executeMutation({ slug })
  }

  return {
    setPromptShown,
  }
}
