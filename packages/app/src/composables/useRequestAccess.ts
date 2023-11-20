import { RequestAccessComposable_RequestAccessDocument } from '../generated/graphql'
import { gql, useMutation } from '@urql/vue'

gql`
mutation RequestAccessComposable_RequestAccess( $projectId: String! ) {
  cloudProjectRequestAccess(projectSlug: $projectId) {
    __typename
    ... on CloudProjectUnauthorized {
      message
      hasRequestedAccess
    }
  }
}
`

export function useRequestAccess () {
  const requestAccessMutation = useMutation(RequestAccessComposable_RequestAccessDocument)

  return async function requestAccess (projectId: string | null | undefined) {
    if (projectId) {
      await requestAccessMutation.executeMutation({ projectId })
    }
  }
}
