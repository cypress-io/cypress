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
import { useI18n } from '@cy/i18n'

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

const { t } = useI18n()

const query = useQuery({ query: HeaderBar_HeaderBarQueryDocument })

</script>
