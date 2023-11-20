<template>
  <div v-if="query.data.value">
    <HeaderBarContent
      :gql="query.data.value"
      :show-browsers="props.showBrowsers"
      :page-name="props.pageName"
      :allow-automatic-prompt-open="props.allowAutomaticPromptOpen"
      @connect-project="emit('connect-project')"
    />
    <slot name="banner" />
  </div>
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

const emit = defineEmits<{
  (event: 'connect-project'): void
}>()

const query = useQuery({ query: HeaderBar_HeaderBarQueryDocument })
</script>
