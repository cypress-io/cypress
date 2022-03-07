<template>
  <div
    ref="target"
    v-html="markdown"
  />
</template>

<script lang="ts" setup>
import type { UseMarkdownOptions } from '../useMarkdown'
import { useMarkdown } from '../useMarkdown'
import { ref } from 'vue'

const props = defineProps<{
  text: string
  options: UseMarkdownOptions
}>()

const target = ref()

const { markdown } = useMarkdown(target, props.text, props.options)
</script>
