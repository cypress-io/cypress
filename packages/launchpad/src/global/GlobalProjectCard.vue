<template>
  <div class="relative min-w-200px rounded-lg border border-gray-300 bg-white px-16px pt-13px pb-15px shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
    <div class="flex-1 min-w-0">
      <button
        class="focus:outline-none underline-transparent grid w-full text-left children:truncate"
        @dblclick="setActiveProject(props.gql.projectRoot)"
      >
        <p class="text-16px row-[1] leading-normal font-medium text-indigo-600">
          {{ props.gql.title }}
        </p>
        <p class="text-sm text-gray-500 relative flex flex-wrap self-end items-center gap-1 bullet-points children:flex children:items-center children:gap-1">
          <span>{{ props.gql.projectRoot }}</span>
        </p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import { useSetActiveProject } from '@packages/frontend-shared/src/composables'
import type { GlobalProjectCard_ProjectFragment } from '../generated/graphql'

const { setActiveProject } = useSetActiveProject()

gql`
fragment GlobalProjectCard_Project on Project {
  id
  title
  projectRoot
  cloudProject {
    latestRun {
      status
    }
  }
}
`

const props = defineProps<{
  gql: GlobalProjectCard_ProjectFragment
}>()

const emit = defineEmits<{
  (event: 'projectSelected', project: GlobalProjectCard_ProjectFragment): void
}>()
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
