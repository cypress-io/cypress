<template>
  <HideDuringScreenshot
    id="sidebar"
    data-cy="sidebar"
    class="flex flex-col bg-gray-1000 border-gray-900 border-r transition-all duration-300 relative"
    :class="isNavBarExpanded ? 'w-[248px]' : 'w-[64px]'"
  >
    <button
      v-if="navIsAlwaysCollapsed"
      class="cursor-pointer left-full top-0 bottom-0 w-[16px] z-1 absolute group hocus:outline-transparent"
      type="button"
      :aria-label="isNavBarExpanded ? t('sidebar.toggleLabel.expanded') : t('sidebar.toggleLabel.collapsed')"
      data-cy="toggle-sidebar"
      :aria-expanded="isNavBarExpanded"
      aria-controls="sidebar"
      @click="toggleNavbarIfAllowed"
    >
      <div
        data-cy="sidebar-nav-indicator"
        class="flex h-full transform origin-left transition-transform w-[16px] scale-x-0 duration-300 items-center group-hocus:scale-x-100"
      >
        <div class="h-full bg-indigo-400 w-[3px]" />
        <i-cy-chevron-right_x16
          class="h-[16px] w-[16px] icon-dark-indigo-400"
          :class="isNavBarExpanded ? 'transform rotate-180': ''"
        />
      </div>
    </button>
    <div class="flex flex-col flex-1 ">
      <SidebarNavigationHeader
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
              cursor-pointer h-[32px] m-[16px]
              p-[7px] transform transition-all
              right-0 bottom-0 w-[32px] duration-300
              inline-block absolute hover:border-gray-500"
          :class="{ 'translate-y-[-48px]': !isNavBarExpanded }"
          :aria-label="t('sidebar.keyboardShortcuts.title')"
          @click="bindingsOpen = true"
        >
          <i-cy-command-key_x16 class="h-[16px] w-[16px] icon-dark-gray-500" />
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
        class="h-[32px] m-[16px] w-[32px]"
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
import { useDebounceFn, useWindowSize } from '@vueuse/core'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

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

const props = defineProps<{
  gql: SidebarNavigationFragment | undefined
  isLoading: boolean
  online: boolean
}>()

const NAV_EXPAND_MIN_SCREEN_WIDTH = 1100

const userProjectStatusStore = useUserProjectStatusStore()

const debugBadge = ref<Badge | undefined>()

const setDebugBadge = useDebounceFn((badge) => {
  debugBadge.value = badge
}, 500)

watchEffect(() => {
  if (props.isLoading && userProjectStatusStore.project.isProjectConnected) {
    setDebugBadge(undefined)

    return
  }

  if (props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject'
    && props.gql.currentProject.cloudProject.runByNumber
    && props.online
  ) {
    const { status, totalFailed } = props.gql.currentProject.cloudProject.runByNumber || {}

    if (status === 'NOTESTS') {
      return
    }

    if (status === 'PASSED') {
      setDebugBadge({ value: '0', status: 'success', label: t('sidebar.debug.passed') })

      return
    }

    let countToDisplay = '0'

    if (totalFailed) {
      countToDisplay = totalFailed < 99
        ? String(totalFailed)
        : '99+'
    }

    if (status === 'FAILED') {
      setDebugBadge({
        value: countToDisplay,
        status: 'failed',
        label: t('sidebar.debug.failed', totalFailed || 0),
      })

      return
    }

    if (status === 'RUNNING') {
      let label
      let status

      if (totalFailed === 0) {
        status = 'success'
        label = t('sidebar.debug.passing')
      } else {
        status = 'failed'
        label = t('sidebar.debug.failing', totalFailed || 0)
      }

      setDebugBadge({
        value: countToDisplay,
        status,
        label,
      })

      return
    }

    const errorLabel = totalFailed && totalFailed > 0
      ? t('sidebar.debug.erroredWithFailures', totalFailed)
      : t('sidebar.debug.errored')

    setDebugBadge({ value: countToDisplay, status: 'error', label: errorLabel })

    return
  }
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
