<template>
  <HeaderBar
    :gql="query.data"
    :show-browsers="props.showBrowsers"
    :page-name="pageName"
  />
</template>

<script setup lang="ts">
import { gql, useQuery } from '@urql/vue'
import HeaderBar from './HeaderBar.vue'
import { HeaderBar_HeaderBarQueryDocument } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import type { RouteRecordName } from 'vue-router'

gql`
query HeaderBar_HeaderBarQuery {
  ...HeaderBar
}
`

const props = defineProps<{
    showBrowsers?: Boolean,
    pageName?: RouteRecordName | null
}>()

const { t } = useI18n()

const query = useQuery({ query: HeaderBar_HeaderBarQueryDocument })
</script>
