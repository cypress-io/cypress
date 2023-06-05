<template>
  <div
    class="bg-white border rounded cursor-pointer flex space-x-3
  border-gray-100 w-full pt-[13px] pr-[4px] pb-[13px] relative items-center group
  hocus-default focus-within-default"
    data-cy="project-card"
    @click="setCurrentProject(props.gql.projectRoot)"
  >
    <div
      class="border-r flex border-r-gray-100 h-[40px] text-center mr-[4px] w-[73px] items-center justify-center"
    >
      <i-cy-folder-outline_x24
        class="h-[28px] w-[24px] icon-dark-gray-500 icon-light-gray-50 group-hocus:icon-dark-indigo-400 group-hocus:icon-light-indigo-200"
      />
    </div>

    <div class="flex-1 min-w-0">
      <button
        class="text-left w-full grid decoration-transparent focus:outline-none children:truncate"
      >
        <span
          class="font-medium leading-normal text-[16px] text-indigo-500 row-[1]"
        >
          {{ props.gql.title }}
        </span>
        <span
          class="text-sm text-gray-500 relative"
          :title="props.gql.projectRoot"
        >
          {{ props.gql.projectRoot }}
        </span>
      </button>
    </div>

    <Menu #="{ open }">
      <MenuButton
        aria-label="Project actions"
        tabindex="-1"
        class="flex h-[32px] text-white w-[32px] items-center
      justify-center focus:outline-transparent focus:text-gray-300"
        @click.stop
      >
        <i-cy-vertical-dots_x16
          class="transition transition-color duration-300 icon-dark-current"
          :class="open ? 'icon-dark-gray-700' : 'group-hocus:icon-dark-gray-300'"
        />
      </MenuButton>
      <MenuItems
        data-cy="project-card-menu-items"
        class="rounded flex flex-col outline-transparent bg-gray-900 text-white
      right-0 right-[18px] -bottom-[104px] z-40 absolute"
      >
        <MenuItem
          v-for="item in menuItems"
          :key="item.name"
          #="{ active }"
        >
          <button
            :data-cy="item.name"
            :class="{ 'bg-gray-700': active }"
            class="border-b border-b-gray-800 text-left py-[8px] px-[16px]"
            @click.stop="handleMenuClick(item.event)"
          >
            {{ item.name }}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  </div>
</template>

<script setup lang="ts">
import { gql, useMutation } from '@urql/vue'
import type { GlobalProjectCardFragment } from '../generated/graphql'
import { GlobalProjectCard_SetCurrentProjectDocument } from '../generated/graphql'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useI18n } from '@cy/i18n'

gql`
mutation GlobalProjectCard_setCurrentProject($path: String!) {
  setCurrentProject(path: $path) {
    ...MainLaunchpadQueryData
  }
}
`

gql`
fragment GlobalProjectCard on GlobalProject {
  id
  title
  projectRoot
}
`

const emit = defineEmits<{
  (event: 'projectSelected', project: GlobalProjectCardFragment): void
  (event: 'removeProject', path: string): void
  (event: 'openInIDE', path: string): void
  (event: 'openInFinder', path: string): void

  // Used for testing, I wish we could easily spy on gql mutations inside
  // of component tests.
  (event: '_setCurrentProject', path: string): void
}>()

const props = defineProps<{
  gql: GlobalProjectCardFragment
}>()
const { t } = useI18n()

type eventName = 'removeProject' | 'openInIDE' | 'openInFinder'

const menuItems: { name: string, event: eventName }[] = [
  { name: t('globalPage.removeProject'), event: 'removeProject' },
  { name: t('globalPage.openInIDE'), event: 'openInIDE' },
  { name: t('globalPage.openInFinder'), event: 'openInFinder' },
]

const setCurrentProjectMutation = useMutation(GlobalProjectCard_SetCurrentProjectDocument)

const setCurrentProject = (project: string) => {
  setCurrentProjectMutation.executeMutation({ path: project })
  emit('_setCurrentProject', project)
}

const handleMenuClick = (eventName: eventName) => {
  switch (eventName) {
    case 'removeProject':
      emit(eventName, props.gql.projectRoot)
      break
    case 'openInIDE':
      emit(eventName, props.gql.projectRoot)
      break
    case 'openInFinder':
      emit(eventName, props.gql.projectRoot)
      break
    default:
      return
  }
}
</script>
