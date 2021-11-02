<template>
  <div
    class="shadow-md text-white p-3 rounded-md flex items-center justify-center"
    :class="bg"
    data-cy="snapshot-message"
  >
    <span>{{ props.messageTitle }}</span>
    <span class="text-purple-400 ml-1">
      {{ props.messageDescription && `(${messageDescription})` }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { SnapshotMessageType } from './snapshot-store'

const props = withDefaults(defineProps<{
  messageTitle?: string
  messageDescription?: string
  messageType?: SnapshotMessageType
}>(), {
  messageTitle: undefined,
  messageDescription: undefined,
  messageType: undefined,
})

const bg = computed(() => {
  if (props.messageType === 'pinned') {
    return 'bg-gray-900'
  }

  if (props.messageType === 'warning') {
    return 'bg-red-400'
  }

  return 'bg-gray-900'
})
</script>
