<template>
  <HeaderBarContent
    v-if="query.data.value"
    :gql="query.data.value"
    :show-browsers="props.showBrowsers"
    :page-name="pageName"
  />
  <div v-else />
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

const props = defineProps<{
    showBrowsers?: boolean,
    pageName?: string
}>()

const query = useQuery({ query: HeaderBar_HeaderBarQueryDocument })

</script>
