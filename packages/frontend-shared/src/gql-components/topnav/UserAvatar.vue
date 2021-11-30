<template>
  <div
    :style="`background-image: url(${gravatarUrl});`"
    class="rounded-50px border-1px border-gray-200 overflow-hidden bg-cover"
  />
</template>

<script setup lang="ts" >
import gravatar from 'gravatar'
import { computed } from 'vue'

const props = defineProps<{
  email: string | undefined,
}>()

const gravatarUrl = computed(() => {
  let opts: { size: string, default: string, forcedefault?: string } = { size: '48', default: 'mm' }

  if (!props.email) {
    opts.forcedefault = 'y'
  }

  return gravatar.url(props.email, opts, true)
})
</script>
