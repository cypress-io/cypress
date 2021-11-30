import { ExternalLink_OpenExternalDocument } from '../generated/graphql'
import { gql, useMutation } from '@urql/vue'
import type { MaybeRef } from '@vueuse/core'
import { unref } from 'vue'

gql`
mutation ExternalLink_OpenExternal ($url: String!) {
  openExternal(url: $url)
}
`

const openExternalMutation = useMutation(ExternalLink_OpenExternalDocument)

export const useExternalLink = ($href?: MaybeRef<string>) => {
  return (href?: string) => openExternalMutation.executeMutation({ url: href ?? unref($href) })
}
