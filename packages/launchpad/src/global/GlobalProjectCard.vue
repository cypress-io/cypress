<template>
  <div
    class="relative w-full rounded-lg border border-gray-100 bg-white px-16px pt-13px pb-15px shadow-sm flex items-center space-x-3 group hocus-default focus-within-default"
  >
    <div class="w-70px text-center flex align-middle justify-center">
      <i-cy-bookmark_x24
        class="w-24px h-28px icon-dark-gray-500 icon-light-gray-50 group-hocus:icon-dark-indigo-400 group-hocus:icon-light-indigo-200"
      />
    </div>

    <div class="flex-1 min-w-0">
      <button
        class="focus:outline-none underline-transparent grid w-full text-left children:truncate"
        @click="setActiveProject(props.gql.projectRoot)"
      >
        <p
          class="text-16px row-[1] leading-normal font-medium text-indigo-500"
        >
          {{ props.gql.title }}
        </p>
        <p
          class="text-sm text-gray-500 relative flex flex-wrap self-end items-center gap-1 bullet-points children:flex children:items-center children:gap-1"
        >
          <span>{{ props.gql.projectRoot }}</span>
        </p>
      </button>
    </div>

    <Menu #="{ open }">
      <MenuButton
        aria-label="Project Actions"
        class="focus:outline-transparent text-white focus:text-gray-300"
      >
        <i-cy-vertical-dots_x16
          class="icon-dark-current transition transition-color duration-300"
          :class="open? 'icon-dark-gray-700' : 'group-hocus:icon-dark-gray-300'"
        />
      </MenuButton>
      <MenuItems class="absolute bg-gray-900 text-white flex flex-col right-0 -bottom-100px right-18px rounded outline-transparent">
        <MenuItem #="{ active }">
          <button
            :class="{ 'bg-gray-700': active }"
            class="text-left px-16px py-8px border-b border-b-gray-800"
          >
            Remove Project
          </button>
        </MenuItem>
        <MenuItem #="{ active }">
          <button
            :class="{ 'bg-gray-700': active }"
            class="text-left px-16px py-8px border-b border-b-gray-800"
          >
            Open In IDE
          </button>
        </MenuItem>
        <MenuItem #="{ active }">
          <button
            :class="{ 'bg-gray-700': active }"
            class="text-left px-16px py-8px border-b border-b-gray-800"
          >
            Open In Finder
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
    <!-- <button
      class="h-10"
      data-testid="removeProjectButton"
      @click="emit('removeProject', props.gql.projectRoot)"
    >
      <Icon
        icon="ant-design:close-circle-outlined"
        width="1.5em"
        height="1.5em"
        class="text-gray-600"
      />
    </button>-->
  </div>
</template>

<script setup lang="ts">
import { gql, useMutation } from '@urql/vue'
import { Icon } from '@iconify/vue'
import { GlobalProjectCardFragment, GlobalProjectCard_SetActiveProjectDocument } from '../generated/graphql'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'

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
    content: "";
    display: inline-block;
  }

  &:last-child:after {
    @apply hidden;
  }
}
</style>
