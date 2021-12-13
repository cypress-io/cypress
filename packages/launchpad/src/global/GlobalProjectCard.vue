<template>
  <div
    class="cursor-pointer relative w-full rounded border border-gray-100
  bg-white pr-4px pt-13px pb-13px flex items-center space-x-3 group
  hocus-default focus-within-default"
    data-cy="project-card"
    @click="setActiveProject(props.gql.projectRoot)"
  >
    <div
      class="w-73px h-40px text-center flex items-center justify-center border-r border-r-gray-100 mr-4px"
    >
      <i-cy-bookmark_x24
        class="w-24px h-28px icon-dark-gray-500 icon-light-gray-50 group-hocus:icon-dark-indigo-400 group-hocus:icon-light-indigo-200"
      />
    </div>

    <div class="flex-1 min-w-0">
      <button
        class="focus:outline-none underline-transparent grid w-full text-left children:truncate"
      >
        <span
          class="text-16px row-[1] leading-normal font-medium text-indigo-500"
        >{{ props.gql.title }}</span>
        <span class="text-sm text-gray-500 relative">{{ props.gql.projectRoot }}</span>
      </button>
    </div>

    <Menu #="{ open }">
      <MenuButton
        aria-label="Project Actions"
        class="focus:outline-transparent w-32px h-32px flex items-center
      justify-center text-white focus:text-gray-300"
        @click.stop
      >
        <i-cy-vertical-dots_x16
          class="icon-dark-current transition transition-color duration-300"
          :class="open ? 'icon-dark-gray-700' : 'group-hocus:icon-dark-gray-300'"
        />
      </MenuButton>
      <MenuItems
        data-cy="project-card-menu-items"
        class="absolute bg-gray-900 text-white flex flex-col right-0
      -bottom-104px right-18px outline-transparent z-40 rounded overflow-scroll"
      >
        <MenuItem
          v-for="item in menuItems"
          :key="item.name"
          #="{ active }"
        >
          <button
            :data-cy="item.name"
            :class="{ 'bg-gray-700': active }"
            class="text-left px-16px py-8px border-b border-b-gray-800"
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
import { GlobalProjectCardFragment, GlobalProjectCard_SetActiveProjectDocument } from '../generated/graphql'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { useI18n } from '@cy/i18n'

gql`
mutation GlobalProjectCard_setActiveProject($path: String!) {
  setActiveProject(path: $path) 
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
  (event: '_setActiveProject', path: string): void
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

const setActiveProjectMutation = useMutation(GlobalProjectCard_SetActiveProjectDocument)

const setActiveProject = (project: string) => {
  setActiveProjectMutation.executeMutation({ path: project })
  emit('_setActiveProject', project)
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
