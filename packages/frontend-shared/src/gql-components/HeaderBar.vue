<template>
  <HeaderBarContent
    v-if="query.data.value"
    :gql="query.data.value"
    :show-browsers="showBrowsers"
    :page-name="pageName"
    :allow-automatic-prompt-open="allowAutomaticPromptOpen"
  />
</template>

<script setup lang="ts">
import { gql, useQuery } from '@urql/vue'
import HeaderBarContent from './HeaderBarContent.vue'
import { HeaderBar_HeaderBarQueryDocument } from '../generated/graphql'

gql`
query HeaderBar_HeaderBarQuery {
  ...HeaderBar_HeaderBarContent
}
`

defineProps<{
  showBrowsers?: boolean,
  pageName?: string,
  allowAutomaticPromptOpen?: boolean
}>()

const query = useQuery({ query: HeaderBar_HeaderBarQueryDocument })

</script>
