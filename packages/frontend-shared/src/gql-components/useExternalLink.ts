import { ExternalLink_OpenExternalDocument } from '../generated/graphql'
import { gql, useMutation } from '@urql/vue'
import type { MaybeRef } from '@vueuse/core'
import { unref } from 'vue'

gql`
mutation ExternalLink_OpenExternal ($url: String!, $includeGraphqlPort: Boolean) {
  openExternal(url: $url, includeGraphqlPort: $includeGraphqlPort)
}
`

export const useExternalLink = ($href?: MaybeRef<string>, includeGraphqlPort: boolean = false) => {
  const openExternalMutation = useMutation(ExternalLink_OpenExternalDocument)

  return (href?: string) => {
    const resolvedHref = unref(typeof href === 'string' ? href : $href)

    if (!resolvedHref) {
      return new Error(`Cannot open external link. Possible urls passed in were ${{ localHref: href, initialHref: unref($href) }}`)
    }

    return openExternalMutation.executeMutation({ url: resolvedHref, includeGraphqlPort })
  }
}
