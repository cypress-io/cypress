<template>
  <div
    :style="`background-image: url(${gravatarUrl});`"
    class="bg-cover border-[1px] border-gray-200 rounded-[50px] overflow-hidden"
    data-cy="user-avatar"
  />
</template>

<script setup lang="ts" >
import gravatar from 'gravatar'
import { computed } from 'vue'

const props = defineProps<{
  email?: string | null
}>()

const gravatarUrl = computed(() => {
  let opts: { size: string, default: string, forcedefault?: string } = { size: '48', default: 'mm' }

  if (!props.email) {
    opts.forcedefault = 'y'
  }

  return gravatar.url(props.email, opts, true)
})
</script>
