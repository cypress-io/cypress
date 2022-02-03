<template>
  <!-- eslint-disable vue/multiline-html-element-content-newline  -->
  <BaseLink
    data-cy="external"
    :href="props.href"
    :use-default-hocus="props.useDefaultHocus"
    role="link"
    @click.prevent="open"
    @keypress.space.enter.prevent="open"
  ><slot /></BaseLink>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  inheritAttrs: true,
})
</script>

<script setup lang="ts">
import BaseLink from '../components/BaseLink.vue'
import { useExternalLink } from '../gql-components/useExternalLink'

const props = withDefaults(defineProps<{
  href: string,
  useDefaultHocus?: boolean
}>(), {
  useDefaultHocus: true,
})

const open = useExternalLink(props.href)
</script>
