<template>
  <div class="relative min-w-200px rounded-lg border border-gray-300 bg-white px-16px pt-13px pb-15px shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
    <div class="flex-1 min-w-0">
      <button
        class="focus:outline-none underline-transparent grid w-full text-left children:truncate"
        @dblclick="setActiveProject(props.gql.projectRoot)"
      >
        <p class="text-16px row-[1] leading-normal font-medium text-indigo-600">{{ props.gql.title }}</p>
        <p class="text-sm text-gray-500 relative flex flex-wrap self-end items-center gap-1 bullet-points children:flex children:items-center children:gap-1">
          <span>{{ props.gql.projectRoot }}</span>
        </p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, FunctionalComponent, SVGAttributes } from 'vue'
import { gql } from '@urql/vue'
import Icon from '../components/icon/Icon.vue'
import IconChecked from 'virtual:vite-icons/mdi/check-circle'
import IconX from 'virtual:vite-icons/mdi/plus-circle'
import IconPending from 'virtual:vite-icons/mdi/refresh-circle'
import { useSetActiveProject } from '../composables'
import type { CloudRunStatus, GlobalProjectCard_ProjectFragment } from '../generated/graphql'

const { setActiveProject } = useSetActiveProject()

type IconMap = {
  [x in CloudRunStatus]: {
    icon: FunctionalComponent<SVGAttributes, {}>
    classes: string
  }
}

const icons: Partial<IconMap> = {
  PASSED: {
    icon: IconChecked,
    classes: 'text-green-500'
  },
  FAILED: {
    icon: IconX,
    classes: 'text-red-500 rotate-45 translate'
  },
  RUNNING: {
    icon: IconPending,
    classes: 'text-blue-500'
  }
}

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

// TODO: I want to use an enum here for 'lastRunStatus'
// but I'm struggling to get the types within the tests
// When GQL exists, I'll be able to pull in the shared types.
const props = defineProps<{
  gql: GlobalProjectCard_ProjectFragment
}>()

const iconForStatus = computed(() => {
  const status = props.gql.cloudProject?.latestRun?.status
  if (!status) {
    return
  }
  return icons[status]
})
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
