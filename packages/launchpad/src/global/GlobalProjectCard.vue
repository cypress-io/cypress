<template>
  <div class="relative min-w-200px rounded-lg border border-gray-100 bg-white px-16px pt-13px pb-15px shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
    <div class="flex-1 min-w-0">
      <button
        class="focus:outline-none underline-transparent grid w-full text-left children:truncate"
        @click="setActiveProject(props.gql.projectRoot)"
      >
        <p class="text-16px row-[1] leading-normal font-medium text-indigo-500">
          {{ props.gql.title }}
        </p>
        <p class="text-sm text-gray-500 relative flex flex-wrap self-end items-center gap-1 bullet-points children:flex children:items-center children:gap-1">
          <span>{{ props.gql.projectRoot }}</span>
        </p>
      </button>
    </div>
    <button
      class="h-10"
      data-testid="removeProjectButton"
      @click="$emit('removeProject', props.gql.projectRoot)"
    >
      <Icon
        icon="ant-design:close-circle-outlined"
        width="1.5em"
        height="1.5em"
        class="text-gray-600"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { gql, useMutation } from '@urql/vue'
import { Icon } from '@iconify/vue'
import { GlobalProjectCardFragment, GlobalProjectCard_SetActiveProjectDocument } from '../generated/graphql'

gql`
mutation GlobalProjectCard_setActiveProject($path: String!) {
  setActiveProject(path: $path) {
    activeProject {
      id
      title
      projectId
      projectRoot
      isFirstTimeCT
      isFirstTimeE2E
    }
  }
}
`

gql`
fragment GlobalProjectCard on Project {
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

const setActiveProjectMutation = useMutation(GlobalProjectCard_SetActiveProjectDocument)

const setActiveProject = (project: string) => {
  setActiveProjectMutation.executeMutation({ path: project })
}

const props = defineProps<{
  gql: GlobalProjectCardFragment
}>()

const emit = defineEmits<{
  (event: 'projectSelected', project: GlobalProjectCardFragment): void
  (event: 'removeProject', path: string): void
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
