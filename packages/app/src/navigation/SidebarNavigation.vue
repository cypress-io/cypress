<template>
  <HideDuringScreenshot
    id="sidebar"
    data-cy="sidebar"
    class="flex flex-col bg-gray-1000 transition-all duration-300 relative"
    :class="isNavBarExpanded ? 'w-248px' : 'w-64px'"
  >
    <button
      v-if="navIsAlwaysCollapsed"
      class="cursor-pointer left-full top-0 bottom-0 w-16px z-1 absolute group hocus:outline-transparent"
      type="button"
      :aria-label="isNavBarExpanded ? t('sidebar.toggleLabel.expanded') : t('sidebar.toggleLabel.collapsed')"
      data-cy="toggle-sidebar"
      :aria-expanded="isNavBarExpanded"
      aria-controls="sidebar"
      @click="toggleNavbarIfAllowed"
    >
      <div
        data-cy="sidebar-nav-indicator"
        class="flex h-full transform origin-left transition-transform w-16px scale-x-0 duration-300 items-center group-hocus:scale-x-100"
      >
        <div class="h-full bg-indigo-400 w-3px" />
        <i-cy-chevron-right_x16
          class="h-16px w-16px icon-dark-indigo-400"
          :class="isNavBarExpanded ? 'transform rotate-180': ''"
        />
      </div>
    </button>
    <div class="flex flex-col flex-1 overflow-y-auto ">
      <SidebarNavigationHeader
        v-if="query.data.value"
        :gql="query.data.value"
        :is-nav-bar-expanded="isNavBarExpanded"
      />
      <nav
        class="space-y-1 bg-gray-1000 flex-1"
        :aria-label="t('sidebar.nav.ariaLabel')"
      >
        <RouterLink
          v-for="item in navigation"
          v-slot="{ isExactActive }"
          :key="item.name"
          :to="item.href"
          :data-cy="`sidebar-link-${item.name.toLowerCase()}-page`"
        >
          <SidebarNavigationRow
            :active="isExactActive"
            :icon="item.icon"
            :name="item.name"
            :is-nav-bar-expanded="isNavBarExpanded"
          />
        </RouterLink>
      </nav>
      <Tooltip
        placement="right"
        :disabled="isNavBarExpanded"
        :distance="8"
        :skidding="-16"
      >
        <button
          data-cy="keyboard-modal-trigger"
          type="button"
          class="border border-transparent rounded
              cursor-pointer h-32px m-16px
              p-7px transform transition-all
              right-0 bottom-0 w-32px duration-300
              inline-block absolute hover:border-gray-500"
          :class="{ '-translate-y-48px': !isNavBarExpanded }"
          :aria-label="t('sidebar.keyboardShortcuts.title')"
          @click="bindingsOpen = true"
        >
          <i-cy-command-key_x16 class="h-16px w-16px icon-dark-gray-500" />
        </button>
        <template #popper>
          {{ t('sidebar.keyboardShortcuts.title') }}
        </template>
      </Tooltip>
      <KeyboardBindingsModal
        :show="bindingsOpen"
        @close="bindingsOpen = false"
      />
      <img
        :src="CypressLogo"
        class="h-32px m-16px w-32px"
        alt="Cypress"
      >
    </div>
  </HideDuringScreenshot>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import SidebarNavigationRow from './SidebarNavigationRow.vue'
import KeyboardBindingsModal from './KeyboardBindingsModal.vue'
import CodeIcon from '~icons/cy/code-editor_x24'
import RunsIcon from '~icons/cy/runs_x24'
import SettingsIcon from '~icons/cy/settings_x24'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import HideDuringScreenshot from '../runner/screenshot/HideDuringScreenshot.vue'
import { SideBarNavigationDocument, SideBarNavigation_SetPreferencesDocument } from '../generated/graphql'
import CypressLogo from '@packages/frontend-shared/src/assets/logos/cypress_s.png'
import { useI18n } from '@cy/i18n'
import { useRoute } from 'vue-router'
import SidebarNavigationHeader from './SidebarNavigationHeader.vue'
import { useWindowSize } from '@vueuse/core'

const { t } = useI18n()

const navigation = [
  { name: 'Specs', icon: CodeIcon, href: '/specs' },
  { name: 'Runs', icon: RunsIcon, href: '/runs' },
  { name: 'Settings', icon: SettingsIcon, href: '/settings' },
]

gql`
fragment SidebarNavigation on Query {
  localSettings {
    preferences {
      isSideNavigationOpen
      isSpecsListOpen
      autoScrollingEnabled
      reporterWidth
      specListWidth
    }
  }
}
`

gql`
mutation SideBarNavigation_SetPreferences ($value: String!) {
  setPreferences (value: $value) {
    ...SidebarNavigation
  }
}`

gql`
query SideBarNavigation {
  ...SidebarNavigationHeader
  ...SidebarNavigation
}
`

const NAV_EXPAND_MIN_SCREEN_WIDTH = 1024

const query = useQuery({ query: SideBarNavigationDocument })

const setPreferences = useMutation(SideBarNavigation_SetPreferencesDocument)

const bindingsOpen = ref(false)

const route = useRoute()

const navIsAlwaysCollapsed = computed(() => width.value >= NAV_EXPAND_MIN_SCREEN_WIDTH && route.meta?.navBarExpandedAllowed !== false)

const isNavBarExpanded = ref(true)

const { width } = useWindowSize()

watchEffect(() => {
  if (width.value < NAV_EXPAND_MIN_SCREEN_WIDTH || route.meta?.navBarExpandedAllowed === false) {
    isNavBarExpanded.value = false
  } else {
    isNavBarExpanded.value = query.data?.value?.localSettings.preferences.isSideNavigationOpen ?? true
  }
})

const toggleNavbarIfAllowed = () => {
  if (width.value < NAV_EXPAND_MIN_SCREEN_WIDTH || route.meta?.navBarExpandedAllowed === false) {
    return
  }

  setPreferences.executeMutation({ value: JSON.stringify({ isSideNavigationOpen: !isNavBarExpanded.value }) })
}

</script>
