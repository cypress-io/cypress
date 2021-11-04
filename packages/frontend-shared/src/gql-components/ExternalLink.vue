<template>
  <BaseLink
    :href="props.href"
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

const props = defineProps<{
  href: string,
}>()

const openExternal = () => {
  openExternalMutation.executeMutation({ url: props.href })
}
</script>
