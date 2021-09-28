<template>
  <div class="relative min-w-200px rounded-lg border border-gray-300 bg-white px-16px pt-13px pb-15px shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
    <div class="flex-1 min-w-0">
      <button
        class="focus:outline-none underline-transparent grid w-full text-left children:truncate"
        @click="emit('projectSelected', project)"
      >
        <p class="text-16px row-[1] leading-normal font-medium text-indigo-600">
          {{ project.name }}
        </p>
        <p class="text-sm text-gray-500 relative flex flex-wrap self-end items-center gap-1 bullet-points children:flex children:items-center children:gap-1">
          <span>{{ getTimeAgo(project.lastRun) }}</span>
          <span>project/master</span>
          <span>v8.0</span>
        </p>
        <Icon
          :icon="iconForStatus.icon"
          :class="iconForStatus.classes"
          class="ml-2 justify-self-end self-center row-start-1 row-end-3 col-start-2 text-sm"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '../components/icon/Icon.vue'
import IconChecked from 'virtual:vite-icons/mdi/check-circle'
import IconX from 'virtual:vite-icons/mdi/plus-circle'
import IconPending from 'virtual:vite-icons/mdi/refresh-circle'

import { getTimeAgo } from '../utils/time'

const icons = {
  passed: {
    icon: IconChecked,
    classes: 'text-green-500',
  },
  failed: {
    icon: IconX,
    classes: 'text-red-500 rotate-45 translate',
  },
  pending: {
    icon: IconPending,
    classes: 'text-blue-500',
  },
}

// TOOD: use graphql types here
interface Project {
 name: string
 lastRun: number
 lastRunStatus: string
}

// TODO: I want to use an enum here for 'lastRunStatus'
// but I'm struggling to get the types within the tests
// When GQL exists, I'll be able to pull in the shared types.
const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  (event: 'projectSelected', project: Project): void
}>()

const iconForStatus = computed(() => icons[props.project.lastRunStatus])
</script>

<style scoped lang="scss">
// You can't do things like `children:after:....` inside of the inline classes.
// Not sure why.
.bullet-points > * {
  &:after {
    @apply min-h-4px max-h-4px max-w-4px min-w-4px rounded-full bg-gray-300;
    content: '';
    display: inline-block;
  }

  &:last-child:after {
    @apply hidden;
  }
}
</style>
