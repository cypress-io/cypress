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
          :to="{name: item.pageComponent, params: item.params }"
          :data-cy="`sidebar-link-${item.name.toLowerCase()}-page`"
          @click="$event => item.onClick?.()"
        >
          <SidebarNavigationRow
            :active="isExactActive"
            :icon="item.icon"
            :name="item.name"
            :is-nav-bar-expanded="isNavBarExpanded"
            :badge="item.badge"
            :icon-status="item.iconStatus"
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
import SidebarNavigationRow, { Badge, IconStatus } from './SidebarNavigationRow.vue'
import KeyboardBindingsModal from './KeyboardBindingsModal.vue'
import {
  IconTechnologyCodeEditor,
  IconTechnologyTestResults,
  IconObjectGear,
  IconObjectBug,
} from '@cypress-design/vue-icon'
import { OutlineStatusIcon } from '@cypress-design/vue-statusicon'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import HideDuringScreenshot from '../runner/screenshot/HideDuringScreenshot.vue'
import { SidebarNavigationFragment, SideBarNavigation_SetPreferencesDocument } from '../generated/graphql'
import CypressLogo from '@packages/frontend-shared/src/assets/logos/cypress_s.png'
import { useI18n } from '@cy/i18n'
import { useRoute, RouterLink } from 'vue-router'
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
        selectedRun: runByNumber(runNumber: $selectedRunNumber) @include(if: $hasSelectedRun){
          id
          runNumber
          status
          totalFailed
        }
        latestRun: runByNumber(runNumber: $latestRunNumber) @include(if: $hasLatestRun){
          id
          runNumber
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

const runsIconStatus = ref<IconStatus | undefined>()

const setRunsIconStatus = useDebounceFn((iconStatus) => {
  runsIconStatus.value = iconStatus
}, 500)

const getStatusIcon = (status) => {
  return status ? OutlineStatusIcon : IconTechnologyTestResults
}

const selectedRun = computed(() => {
  if (props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject') {
    return props.gql.currentProject.cloudProject.selectedRun
  }

  return undefined
})

const latestRun = computed(() => {
  if (props.gql?.currentProject?.cloudProject?.__typename === 'CloudProject') {
    return props.gql.currentProject.cloudProject.latestRun
  }

  return undefined
})

watchEffect(() => {
  if (props.isLoading && userProjectStatusStore.project.isProjectConnected) {
    setRunsIconStatus(undefined)

    return
  }

  if (latestRun.value
    && props.online
  ) {
    const { status, totalFailed } = latestRun.value

    switch (status) {
      case 'RUNNING':
        if ((totalFailed || 0) > 0) {
          setRunsIconStatus({ value: 'failing', label: t('sidebar.runs.failing', totalFailed || 0) })
        } else {
          setRunsIconStatus({ value: 'running', label: t('sidebar.runs.running') })
        }

        break
      case 'PASSED':
        setRunsIconStatus({ value: 'passed', label: t('sidebar.runs.passed') })
        break
      case 'FAILED':
        setRunsIconStatus({ value: 'failed', label: t('sidebar.runs.failed', totalFailed || 0) })
        break
      case 'CANCELLED':
        setRunsIconStatus({ value: 'cancelled', label: t('sidebar.runs.cancelled') })
        break
      case 'ERRORED':
      case 'NOTESTS':
      case 'OVERLIMIT':
      case 'TIMEDOUT':
        setRunsIconStatus({ value: 'errored', label: t((totalFailed && totalFailed > 0 ? 'sidebar.runs.erroredWithFailures' : 'sidebar.runs.errored'), totalFailed || 0) })
        break
      default:
        setRunsIconStatus(undefined)
        break
    }

    return
  }

  setRunsIconStatus(undefined)
})

watchEffect(() => {
  if (props.isLoading && userProjectStatusStore.project.isProjectConnected) {
    setDebugBadge(undefined)

    return
  }

  if (selectedRun.value
    && props.online
  ) {
    const { status, totalFailed } = selectedRun.value

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
      let label: string
      let status: string

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

interface NavigationItem {
  name: string
  icon: FunctionalComponent
  pageComponent: string
  params?: Record<string, any>
  badge?: Badge
  onClick?: () => void
  iconStatus?: IconStatus
}

const navigation = computed<NavigationItem[]>(() => {
  return [
    { name: 'Specs', icon: IconTechnologyCodeEditor, pageComponent: 'Specs' },
    { name: 'Runs', icon: getStatusIcon(runsIconStatus.value), pageComponent: 'Runs', iconStatus: runsIconStatus.value },
    { name: 'Debug', icon: IconObjectBug, pageComponent: 'Debug', badge: debugBadge.value, params: { from: 'sidebar', runNumber: selectedRun.value?.runNumber } },
    { name: 'Settings', icon: IconObjectGear, pageComponent: 'Settings' },
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
