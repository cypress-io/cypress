<template>
  <div class="h-full grid grid-cols-[16px,auto,auto] items-center gap-10px">
    <component
      :is="IconFolder"
      class="icon-light-gray-50 icon-dark-gray-200 document-icon"
      :class="{'transform rotate-270': !expanded}"
    />
    <div>
      <template
        v-for="(directory, idx) in directories || []"
        :key="directory"
      >
        <span>{{ directory }}</span>
        <span
          v-if="idx !== directories.length - 1"
          class="font-medium text-gray-800 px-4px"
        >
          /
        </span>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import IconFolder from '~icons/cy/folder-outline_x24.svg'

defineProps<{
  directories: string[]
  expanded: boolean
}>()
</script>
