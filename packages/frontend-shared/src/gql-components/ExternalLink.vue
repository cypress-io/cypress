<template>
  <BaseLink
    data-cy="external"
    :href="props.href"
    :use-default-hocus="props.useDefaultHocus"
    @click.prevent="openExternal"
  >
    <slot />
  </BaseLink>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  inheritAttrs: true,
})
</script>

<script setup lang="ts">
import BaseLink from '../components/BaseLink.vue'

import {
  App_OpenExternalDocument,
} from '../generated/graphql'

import { gql, useMutation } from '@urql/vue'

gql`
mutation App_OpenExternal ($url: String!) {
  openExternal(url: $url)
}
`

const openExternalMutation = useMutation(App_OpenExternalDocument)

const props = withDefaults(defineProps<{
  href: string,
  useDefaultHocus?: boolean
}>(), {
  useDefaultHocus: true,
})

const openExternal = () => {
  openExternalMutation.executeMutation({ url: props.href })
}
</script>
