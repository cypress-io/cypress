<template>
  <div>
    <HeaderBarContent
      v-if="query.data.value"
      :gql="query.data.value"
      :show-browsers="props.showBrowsers"
      :page-name="props.pageName"
      :allow-automatic-prompt-open="props.allowAutomaticPromptOpen"
    />
  </div>
</template>

<script setup lang="ts">
import { gql, useQuery, useSubscription } from '@urql/vue'
import HeaderBarContent from './HeaderBarContent.vue'
import { HeaderBar_HeaderBarQueryDocument, HeaderBar_CloudViewerResolvedDocument, HeaderBar_VersionsResolvedDocument } from '../generated/graphql'

gql`
query HeaderBar_HeaderBarQuery {
  ...HeaderBar_HeaderBarContent
}
`

gql`
subscription HeaderBar_cloudViewerResolved {
  cloudViewerChange {
    ...Auth
  }
}
`

gql`
subscription HeaderBar_versionsResolved {
  versionsResolved {
    ...TopNav_Versions
  }
}
`

const props = withDefaults(
  defineProps<{
    showBrowsers?: boolean
    pageName?: string
    allowAutomaticPromptOpen?: boolean
  }>(), {
    allowAutomaticPromptOpen: false,
    pageName: undefined,
  },
)

const query = useQuery({ query: HeaderBar_HeaderBarQueryDocument })

useSubscription({ query: HeaderBar_CloudViewerResolvedDocument })
useSubscription({ query: HeaderBar_VersionsResolvedDocument })

</script>
