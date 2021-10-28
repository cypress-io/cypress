<template>
  <div class="relative">
    <CopyButton
      class="absolute right-8px top-8px"
      :text="command"
      no-icon
    />
    <code class="text-gray-600 border border-gray-100 block leading-48px px-16px rounded">
      <span class="text-purple-400">
        {{ projectName }}:~$
      </span>
      {{ command }}
    </code>
  </div>
</template>

<script lang="ts" setup>
import CopyButton from './CopyButton.vue'

defineProps<{
  projectName: string,
  command: string
}>()
</script>
