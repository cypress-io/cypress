<template>
  <HideDuringScreenshot
    :aria-expanded="mainStore.navBarExpanded"
    class="flex flex-col bg-gray-1000 transition-all duration-300 relative"
    :class="mainStore.navBarExpanded ? 'w-248px' : 'w-64px'"
  >
    <button
      v-if="navIsAlwaysCollapsed"
      class="cursor-pointer left-full top-0 bottom-0 w-16px z-1 absolute group hocus:outline-transparent"
      role="button"
      aria-label="toggle navigation"
      @click="mainStore.toggleNavBar"
    >
      <div class="flex h-full transform origin-left transition-transform w-16px scale-x-0 duration-300 items-center group-hocus:scale-x-100">
        <div class="h-full bg-indigo-400 w-3px" />
        <i-cy-chevron-right_x16
          class="h-16px w-16px icon-dark-indigo-400"
          :class="mainStore.navBarExpanded ? 'transform rotate-180': ''"
        />
      </div>
    </button>
    <div class="flex flex-col flex-1 overflow-y-auto ">
      <SidebarTooltip
        class="border-b flex border-gray-900 flex-shrink-0 h-64px items-center"
        :disabled="mainStore.navBarExpanded"
        :popper-top-offset="4"
        popper-class="h-56px"
        data-cy="sidebar-header"
      >
        <i-cy-bookmark_x24
          class="flex-shrink-0
          h-24px
          mx-20px
          w-24px
          icon-dark-gray-200 icon-light-gray-900"
        />
        <div class="text-gray-50 text-size-16px leading-24px truncate">
          {{ currentProject?.title ?? 'Cypress' }}
          <p class="text-gray-600 text-size-14px leading-20px truncate">
            {{ currentProject?.branch }}
          </p>
        </div>

        <template #popper>
          <div class="text-left text-gray-50 text-size-16px leading-16px truncate">
            {{ currentProject?.title ?? 'Cypress' }}
            <p class="text-gray-600 text-size-14px leading-20px truncate">
              {{ currentProject?.branch }}
            </p>
          </div>
        </template>
      </SidebarTooltip>

      <nav
        class="space-y-1 bg-gray-1000 flex-1"
        aria-label="Sidebar"
      >
        <SwitchTestingTypeButton
          v-if="query.data.value"
          :gql="query.data.value"
        />
        <RouterLink
          v-for="item in navigation"
          v-slot="{ isActive }"
          :key="item.name"
          :to="item.href"
        >
          <SidebarNavigationRow
            :data-e2e-href="item.href"
            :active="isActive"
            :icon="item.icon"
            :name="item.name"
          />
        </RouterLink>
      </nav>
      <SidebarTooltip
        class="border border-transparent rounded
              cursor-pointer m-16px p-7px
              transform transition-all right-0
              bottom-0 w-32px duration-300
              inline-block absolute hover:border-gray-500"
        :class="{ '-translate-y-48px': !mainStore.navBarExpanded }"
        :disabled="mainStore.navBarExpanded"
        :popper-top-offset="-4"
        @click="bindingsOpen = true"
      >
        <i-cy-command-key_x16
          class="h-16px w-16px icon-dark-gray-500"
          data-cy="keyboard-shortcuts"
        />
        <template #popper>
          {{ t('sideBar.keyboardShortcuts.title') }}
        </template>
        <KeyboardBindingsModal
          :show="bindingsOpen"
          @close="bindingsOpen = false"
        />
      </SidebarTooltip>
      <img
        :src="CypressLogo"
        class="h-32px m-16px w-32px"
      >
    </div>
  </HideDuringScreenshot>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql, useQuery } from '@urql/vue'
import SidebarNavigationRow from './SidebarNavigationRow.vue'
import SwitchTestingTypeButton from './SwitchTestingTypeButton.vue'
import KeyboardBindingsModal from './KeyboardBindingsModal.vue'
import CodeIcon from '~icons/cy/code-editor_x24'
import RunsIcon from '~icons/cy/runs_x24'
import SettingsIcon from '~icons/cy/settings_x24'
import SidebarTooltip from './SidebarTooltip.vue'
import HideDuringScreenshot from '../runner/screenshot/HideDuringScreenshot.vue'
import { useMainStore } from '../store'
import { SideBarNavigationDocument } from '../generated/graphql'
import CypressLogo from '@packages/frontend-shared/src/assets/logos/cypress_s.png'
import { useI18n } from '@cy/i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

const navigation = [
  { name: 'Specs', icon: CodeIcon, href: '/specs' },
  { name: 'Runs', icon: RunsIcon, href: '/runs' },
  { name: 'Settings', icon: SettingsIcon, href: '/settings' },
]

gql`
query SideBarNavigation {
  ...SwitchTestingTypeButton
  currentProject {
    id
    title
    branch
  }
}
`

const query = useQuery({ query: SideBarNavigationDocument, requestPolicy: 'network-only' })

const currentProject = computed(() => query.data.value?.currentProject)

const bindingsOpen = ref(false)

const mainStore = useMainStore()

const route = useRoute()

const navIsAlwaysCollapsed = computed(() => route.meta?.navBarExpandedAllowed !== false)

</script>
