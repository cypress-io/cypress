<template>
  <div class="flex items-center py-4px text-sm">
    <i-cy-chevron-down-small_x16
      class="icon-dark-gray-700 mr-8px group-hocus:(icon-dark-gray-300) group-hover:children:(transition-all ease-in-out duration-250)"
      :class="{'transform rotate-270': !expanded}"
    />
    <i-cy-folder_x16 class="mr-8px w-16px h-16px" />
    <template
      v-for="(directory, idx) in directories || []"
      :key="directory"
    >
      <span class="font-medium text-gray-400">{{ directory }}</span>
      <span
        v-if="idx !== directories.length - 1"
        class="font-medium text-gray-800 px-4px"
      >/</span>
    </template>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ directories: string[], expanded: boolean }>()
</script>
