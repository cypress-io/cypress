<template>
  <div class="h-full grid grid-cols-[16px,auto,auto] items-center gap-10px">
    <component
      :is="IconFolder"
      class='icon-light-gray-50 icon-dark-gray-200 document-icon'
    />
    <template
      v-for="(directory, idx) in directories || []"
      :key="directory"
    >
      <span>{{ directory }}</span>
    </template>
  </div>
</template>

<script lang="ts" setup>
import IconFolder from '~icons/cy/folder-outline_x24.svg'

defineProps<{ 
  directories: string[]
  expanded: boolean 
}>()
</script>
