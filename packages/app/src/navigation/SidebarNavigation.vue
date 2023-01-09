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
    <div class="flex flex-col flex-1 ">
      <SidebarNavigationHeader
        v-if="props.gql"
        :gql="props.gql"
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
            :badge="item.badge"
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
import { computed, FunctionalComponent, ref, watchEffect } from 'vue'
import { gql, useMutation } from '@urql/vue'
import SidebarNavigationRow, { Badge } from './SidebarNavigationRow.vue'
import KeyboardBindingsModal from './KeyboardBindingsModal.vue'
import {
  IconTechnologyCodeEditor,
  IconTechnologyTestResults,
  IconObjectGear,
  IconObjectBug,
} from '@cypress-design/vue-icon'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import HideDuringScreenshot from '../runner/screenshot/HideDuringScreenshot.vue'
import { SidebarNavigationFragment, SideBarNavigation_SetPreferencesDocument } from '../generated/graphql'
import CypressLogo from '@packages/frontend-shared/src/assets/logos/cypress_s.png'
import { useI18n } from '@cy/i18n'
import { useRoute } from 'vue-router'
import SidebarNavigationHeader from './SidebarNavigationHeader.vue'
import { useWindowSize } from '@vueuse/core'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { isAllowedFeature } from '@packages/frontend-shared/src/utils/isAllowedFeature'

const { t } = useI18n()

gql`
fragment SidebarNavigation_Settings on Query {
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
fragment SidebarNavigation on Query {
  ...SidebarNavigation_Settings
  currentProject {
    id
    cloudProject {
      __typename
      ... on CloudProject {
        id
        runByNumber(runNumber: $runNumber) @include(if: $hasCurrentRun){
          id
          status
          totalFailed
        }
      }
    }
  }
  ...SidebarNavigationHeader
}
`

gql`
mutation SideBarNavigation_SetPreferences ($value: String!) {
  setPreferences (value: $value, type: global) {
    ...SidebarNavigation_Settings
  }
}`

const props = defineProps<{ gql: SidebarNavigationFragment | undefined, isLoading: boolean }>()

const NAV_EXPAND_MIN_SCREEN_WIDTH = 1024

const loginConnectStore = useLoginConnectStore()

const debugBadge = computed<Badge | undefined>(() => {
  if (props.isLoading) {
    return undefined
  }

  const showNewBadge = isAllowedFeature('debugNewBadge', loginConnectStore)
  const newBadge: Badge = { value: t('sidebar.debug.new'), status: 'success', label: t('sidebar.debug.debugFeature') }

  if (props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject') {
    const { status, totalFailed } = props.gql.currentProject.cloudProject.runByNumber || {}

    if (status === 'NOTESTS' || status === 'RUNNING') {
      return showNewBadge ? newBadge : undefined
    }

    if (status === 'PASSED') {
      return { value: '0', status: 'success', label: t('sidebar.debug.passed') }
    }

    if (totalFailed) {
      const valueToDisplay = totalFailed < 9
        ? String(totalFailed)
        : '9+'

      return {
        value: valueToDisplay,
        status: 'failed',
        label: t('sidebar.debug.failed', totalFailed),
      }
    }

    return { value: '0', status: 'error', label: t('sidebar.debug.errored') }
  }

  return showNewBadge ? newBadge : undefined
})

const navigation = computed<{ name: string, icon: FunctionalComponent, href: string, badge?: Badge }[]>(() => {
  return [
    { name: 'Specs', icon: IconTechnologyCodeEditor, href: '/specs' },
    { name: 'Runs', icon: IconTechnologyTestResults, href: '/runs' },
    { name: 'Debug', icon: IconObjectBug, href: '/debug', badge: debugBadge.value },
    { name: 'Settings', icon: IconObjectGear, href: '/settings' },
  ]
})

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
    isNavBarExpanded.value = props.gql?.localSettings.preferences.isSideNavigationOpen ?? true
  }
})

const toggleNavbarIfAllowed = () => {
  if (width.value < NAV_EXPAND_MIN_SCREEN_WIDTH || route.meta?.navBarExpandedAllowed === false) {
    return
  }

  setPreferences.executeMutation({ value: JSON.stringify({ isSideNavigationOpen: !isNavBarExpanded.value }) })
}

</script>
