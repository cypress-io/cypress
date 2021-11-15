<template>
  <div
    class="h-full grid grid-cols-[14px,16px,auto] items-center gap-8px"
    :data-cy="`row-directory-depth-${depth}`"
  >
    <i-cy-chevron-down-small_x16
      class="
        icon-dark-gray-300 mr-8px text-sm
        group-hocus:(icon-dark-gray-700)
      "
      :class="{'transform rotate-270': !expanded}"
    />
    <component
      :is="IconFolder"
      class="icon-dark-gray-50 icon-light-gray-200 document-icon"
    />

    <div>
      <template
        v-for="(directory, idx) in directories || []"
        :key="directory"
      >
        <span class="font-medium text-gray-600 px-4px">
          {{ directory }}
        </span>
        <span
          v-if="idx !== directories.length - 1"
          class="text-gray-700 px-2px"
        >
          /
        </span>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import IconFolder from '~icons/cy/folder_x16.svg'

defineProps<{
  directories: string[]
  expanded: boolean
  depth: number
}>()
</script>
