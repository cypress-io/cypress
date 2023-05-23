<template>
  <div>
    <HeaderBarContent
      v-if="query.data.value"
      :gql="query.data.value"
      :show-browsers="props.showBrowsers"
      :page-name="props.pageName"
      :allow-automatic-prompt-open="props.allowAutomaticPromptOpen"
      @connect-project="emit('connect-project')"
    />
    <EnableNotificationsBanner
      v-if="query.data.value && showEnableNotificationsBanner"
      :gql="query.data.value"
    />
  </div>
</template>

<script setup lang="ts">
import { gql, useQuery } from '@urql/vue'
import HeaderBarContent from './HeaderBarContent.vue'
import { HeaderBar_HeaderBarQueryDocument } from '../generated/graphql'
import EnableNotificationsBanner from '@packages/app/src/specs/banners/EnableNotificationsBanner.vue'

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
    showEnableNotificationsBanner: boolean
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
