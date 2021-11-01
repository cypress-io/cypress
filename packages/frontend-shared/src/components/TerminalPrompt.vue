<template>
  <div class="relative">
    <CopyButton
      class="absolute right-9px top-9px h-24px px-8px"
      :text="command"
      no-icon
    />
    <code class="text-gray-700 font-light border border-gray-100 block leading-40px px-16px rounded">
      <span class="text-purple-500">
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
