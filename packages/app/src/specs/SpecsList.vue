<template>
  <div class="p-24px spec-container">
    <Alert
      v-if="isAlertOpen"
      v-model="isAlertOpen"
      status="error"
      :title="t('specPage.noSpecError.title')"
      class="mb-16px"
      :icon="WarningIcon"
      dismissible
    >
      <p class="mb-24px">
        {{ t('specPage.noSpecError.intro') }} <InlineCodeFragment variant="error">
          {{ route.params.unrunnable }}
        </InlineCodeFragment>
      </p>
      <p>{{ t('specPage.noSpecError.explainer') }}</p>
    </Alert>
    <Alert
      v-if="isOffline"
      v-model="isOffline"
      data-cy="offline-alert"
      status="warning"
      :title="t('specPage.offlineWarning.title')"
      class="mb-16px"
      :icon="WarningIcon"
      dismissible
    >
      <p class="mb-24px">
        {{ t('specPage.offlineWarning.explainer') }}
      </p>
    </Alert>
    <Alert
      v-if="shouldShowFetchError"
      v-model="shouldShowFetchError"
      status="warning"
      :title="t('specPage.fetchFailedWarning.title')"
      class="mb-16px"
      :icon="WarningIcon"
      dismissible
    >
      <p>
        {{ t('specPage.fetchFailedWarning.explainer1') }}
      </p>
      <p>
        <i18n-t
          scope="global"
          keypath="specPage.fetchFailedWarning.explainer2"
        >
          <ExternalLink
            href="https://www.cypressstatus.com"
            class="font-medium text-indigo-500 contents group-hocus:text-indigo-600"
          >
            Status Page
          </ExternalLink>
        </i18n-t>
      </p>
      <Button
        :prefix-icon="RefreshIcon"
        class="mt-24px"
        @click="refetchFailedCloudData"
      >
        {{ t('specPage.fetchFailedWarning.refreshButton') }}
      </Button>
    </Alert>
    <SpecsListHeader
      v-model="search"
      :specs-list-input-ref-fn="specsListInputRefFn"
      class="pb-32px"
      :result-count="specs.length"
      :spec-count="cachedSpecs.length"
      @show-create-spec-modal="emit('showCreateSpecModal')"
      @show-spec-pattern-modal="showSpecPatternModal = true"
    />
    <SpecPatternModal
      v-if="props.gql.currentProject"
      :show="showSpecPatternModal"
      :gql="props.gql.currentProject"
      @close="showSpecPatternModal = false"
    />
    <div
      v-if="specs.length"
      class="mb-4 grid grid-cols-7 md:grid-cols-9 children:font-medium children:text-gray-800"
      :style="`padding-right: ${scrollbarOffset + 20}px`"
    >
      <div
        class="flex col-span-4 items-center justify-between"
        data-cy="specs-testing-type-header"
      >
        {{ props.gql.currentProject?.currentTestingType === 'component' ?
          t('specPage.componentSpecsHeader') : t('specPage.e2eSpecsHeader') }}
      </div>
      <div class="flex col-span-2 items-center justify-between truncate">
        <LastUpdatedHeader :is-git-available="isGitAvailable" />
      </div>
      <div class="flex items-center justify-end whitespace-nowrap">
        <SpecHeaderCloudDataTooltip
          :gql="props.gql"
          mode="LATEST_RUNS"
          data-cy="latest-runs-header"
          @showLogin="showLogin('Specs Latest Runs Tooltip')"
          @showConnectToProject="showConnectToProject"
        />
      </div>
      <div class="hidden items-center justify-end truncate md:flex md:col-span-2">
        <SpecHeaderCloudDataTooltip
          :gql="props.gql"
          mode="AVG_DURATION"
          data-cy="average-duration-header"
          @showLogin="showLogin('Specs Average Duration Tooltip')"
          @showConnectToProject="showConnectToProject"
        />
      </div>
    </div>
    <!--
      The markup around the virtualized list is pretty delicate. We might be tempted to
      combine the `v-if="specs.length"` above and the `:class="specs.length ? 'grid': 'hidden'"` below
      into a single v-if on a `<template>` that would wrap both, but we are deliberately using
      `hidden` here to ensure that the `.spec-list-container` element stays in the DOM when
      the empty state is shown, fixing a bug that meant recovering from the empty state with the
      "Clear Search" button didn't work as expected.
    -->
    <div
      class="pb-32px spec-list-container"
      :class="specs.length ? 'grid': 'hidden'"
      v-bind="containerProps"
    >
      <div
        v-bind="wrapperProps"
        class="divide-y-1 border-gray-50 border-y-1 children:border-gray-50 children:h-40px"
      >
        <SpecsListRowItem
          v-for="row in list"
          :id="getIdIfDirectory(row)"
          :key="row.index"
          :data-cy="row.data.isLeaf ? 'spec-list-file' : 'spec-list-directory'"
          :data-cy-row="row.data.data?.baseName"
          :is-leaf="row.data.isLeaf"
          :route="{ path: '/specs/runner', query: { file: row.data.data?.relative?.replace(/\\/g, '/') } }"
          @toggleRow="row.data.toggle"
        >
          <template #file>
            <SpecItem
              v-if="row.data.isLeaf"
              :file-name="row.data.data?.fileName || row.data.name"
              :extension="row.data.data?.specFileExtension || ''"
              :indexes="row.data.data?.fileIndexes"
              :style="{ paddingLeft: `${((row.data.depth - 2) * 10) + 22}px` }"
            />

            <RowDirectory
              v-else
              :name="row.data.name"
              :expanded="treeSpecList[row.index].expanded.value"
              :depth="row.data.depth - 2"
              :style="{ paddingLeft: `${(row.data.depth - 2) * 10}px` }"
              :indexes="getDirIndexes(row.data)"
              :aria-controls="getIdIfDirectory(row)"
              @click.stop="row.data.toggle"
            />
          </template>

          <template #git-info>
            <SpecListGitInfo
              v-if="row.data.isLeaf && row.data.data?.gitInfo"
              :gql="row.data.data?.gitInfo"
            />
          </template>

          <template #latest-runs>
            <div
              class="h-full grid justify-items-end items-center"
            >
              <RunStatusDots
                v-if="row.data.isLeaf && row.data.data && (row.data.data.cloudSpec?.data || row.data.data.cloudSpec?.fetchingStatus !== 'FETCHING')"
                :gql="row.data.data.cloudSpec ?? null"
                :spec-file-extension="row.data.data.fileExtension"
                :spec-file-name="row.data.data.fileName"
              />
              <div
                v-else-if="row.data.isLeaf && row.data.data?.cloudSpec?.fetchingStatus === 'FETCHING'"
                class="bg-gray-50 rounded-[20px] h-24px w-full animate-pulse"
                data-cy="run-status-dots-loading"
              />
            </div>
          </template>
          <template #average-duration>
            <AverageDuration
              v-if="row.data.isLeaf"
              :gql="row.data.data?.cloudSpec ?? null"
            />
          </template>
        </SpecsListRowItem>
      </div>
    </div>
    <NoResults
      v-show="!specs.length"
      :search="search"
      :message="t('specPage.noResultsMessage')"
      class="mt-56px"
      @clear="handleClear"
    />
  </div>
  <LoginModal
    v-model="isLoginOpen"
    :gql="props.gql"
    :utm-medium="loginUtmMedium"
    @loggedin="refreshPage"
  />
  <CloudConnectModals
    v-if="isProjectConnectOpen"
    :gql="props.gql"
    @cancel="isProjectConnectOpen = false"
    @success="refreshPage"
  />
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import LastUpdatedHeader from './LastUpdatedHeader.vue'
import SpecHeaderCloudDataTooltip from './SpecHeaderCloudDataTooltip.vue'
import LoginModal from '@cy/gql-components/topnav/LoginModal.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import CloudConnectModals from '../runs/modals/CloudConnectModals.vue'
import SpecsListHeader from './SpecsListHeader.vue'
import SpecListGitInfo from './SpecListGitInfo.vue'
import RunStatusDots from './RunStatusDots.vue'
import AverageDuration from './AverageDuration.vue'
import SpecsListRowItem from './SpecsListRowItem.vue'
import { gql, useMutation, useSubscription } from '@urql/vue'
import { computed, ref, watch } from 'vue'
import { CloudData_RefetchDocument, Specs_SpecsListFragment, SpecsList_GitInfoUpdatedDocument, SpecsListFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { buildSpecTree, fuzzySortSpecs, getDirIndexes, makeFuzzyFoundSpec, useCachedSpecs } from './spec-utils'
import type { FuzzyFoundSpec } from './spec-utils'
import { useCollapsibleTree } from '@packages/frontend-shared/src/composables/useCollapsibleTree'
import RowDirectory from './RowDirectory.vue'
import SpecItem from './SpecItem.vue'
import { useVirtualList } from '@packages/frontend-shared/src/composables/useVirtualList'
import NoResults from '@cy/components/NoResults.vue'
import SpecPatternModal from '../components/SpecPatternModal.vue'
import { useDebounce, useOnline, useResizeObserver } from '@vueuse/core'
import Alert from '../../../frontend-shared/src/components/Alert.vue'
import InlineCodeFragment from '../../../frontend-shared/src/components/InlineCodeFragment.vue'
import WarningIcon from '~icons/cy/warning_x16.svg'
import RefreshIcon from '~icons/cy/action-restart_x16'
import { useRoute } from 'vue-router'
import type { RemoteFetchableStatus } from '@packages/frontend-shared/src/generated/graphql'

const route = useRoute()
const { t } = useI18n()

const isOnline = useOnline()
const isOffline = ref(false)

watch(isOnline, (newIsOnlineValue) => isOffline.value = !newIsOnlineValue, { immediate: true })

const isProjectConnectOpen = ref(false)
const isLoginOpen = ref(false)
const loginUtmMedium = ref('')

const showLogin = (utmMedium: string) => {
  loginUtmMedium.value = utmMedium
  isLoginOpen.value = true
}

const showConnectToProject = () => {
  isProjectConnectOpen.value = true
}

const isGitAvailable = computed(() => {
  return !(props.gql.currentProject?.specs.some((s) => s.gitInfo?.statusType === 'noGitInfo') ?? false)
})

const hasCloudErrors = computed(() => {
  return props.gql.currentProject?.specs.some((s) => s.cloudSpec?.fetchingStatus === 'ERRORED') ?? false
})

const shouldShowFetchError = ref(false)

watch(hasCloudErrors, (wasErrorFound) => shouldShowFetchError.value = wasErrorFound, { immediate: true })

gql`
subscription SpecsList_GitInfoUpdated {
  gitInfoChange {
    id
    absolute
    gitInfo {
      ...SpecListRow
    }
  }
}
`

gql`
fragment SpecsList on Spec {
  id
  name
  specType
  absolute
  baseName
  fileName
  specFileExtension
  fileExtension
  relative
  gitInfo {
    ...SpecListRow
  }
  cloudSpec(name: "cloudSpec") @include(if: $hasBranch) {
    id
    fetchingStatus
    ...AverageDuration
    ...RunStatusDots
  }
}
`

gql`
fragment Specs_SpecsList on Query {
  currentProject {
    id
    projectRoot
    currentTestingType
    cloudProject {
      __typename
      ... on CloudProject {
        id
      }
    }
    specs {
      id
      ...SpecsList
    }
    config
    ...SpecPatternModal
  }
  ...SpecHeaderCloudDataTooltip
}
`

useSubscription({ query: SpecsList_GitInfoUpdatedDocument })

const props = withDefaults(defineProps<{
  gql: Specs_SpecsListFragment
  mostRecentUpdate: string | null
}>(), {
  mostRecentUpdate: null,
})

const emit = defineEmits<{
  (e: 'showCreateSpecModal'): void
}>()

const showSpecPatternModal = ref(false)

const isAlertOpen = ref(!!route.params?.unrunnable)

const cachedSpecs = useCachedSpecs(
  computed(() => props.gql.currentProject?.specs ?? []),
)

const search = ref('')
const specsListInputRef = ref<HTMLInputElement>()
const debouncedSearchString = useDebounce(search, 200)

const specsListInputRefFn = () => specsListInputRef

function handleClear () {
  search.value = ''
  specsListInputRef.value?.focus()
}

const specs = computed(() => {
  const fuzzyFoundSpecs = cachedSpecs.value.map(makeFuzzyFoundSpec)

  if (!debouncedSearchString.value) {
    return fuzzyFoundSpecs
  }

  return fuzzySortSpecs(fuzzyFoundSpecs, debouncedSearchString.value)
})

// Maintain a cache of what tree directories are expanded/collapsed so the tree state is visually preserved
// when specs list data is updated on scroll (e.g., latest-runs & average-duration data loading async)
const treeExpansionCache = ref(new Map<string, boolean>())

// When search value changes or when specs are added/removed, reset the tree expansion cache so that any collapsed directories re-expand
watch([() => search.value, () => specs.value.length], () => treeExpansionCache.value.clear())

const collapsible = computed(() => {
  return useCollapsibleTree(
    buildSpecTree<FuzzyFoundSpec<SpecsListFragment>>(specs.value), { dropRoot: true, cache: treeExpansionCache.value },
  )
})
const treeSpecList = computed(() => collapsible.value.tree.filter(((item) => !item.hidden.value)))

const { containerProps, list, wrapperProps, scrollTo } = useVirtualList(treeSpecList, { itemHeight: 40, overscan: 10 })

const scrollbarOffset = ref(0)

// Watch the sizing of the specs list so we can detect when a scrollbar is added/removed
// We then calculate the width of the scrollbar and add that as padding to the list header
// so that the columns stay aligned
useResizeObserver(containerProps.ref, (entries) => {
  const specListContainer = entries?.[0]
  const containerElement = specListContainer?.target as HTMLElement

  if (containerElement) {
    const displayedScrollbarWidth = containerElement.offsetWidth - containerElement.clientWidth

    scrollbarOffset.value = displayedScrollbarWidth
  } else {
    scrollbarOffset.value = 0
  }
})

// If you are scrolled down the virtual list and the search filter changes,
// reset scroll position to top of list
watch(() => debouncedSearchString.value, () => scrollTo(0))

function getIdIfDirectory (row) {
  if (row.data.isLeaf && row.data) {
    return undefined
  }

  return `speclist-${row.data.data.relative.replace(row.data.data.baseName, '')}`
}

gql`
mutation CloudData_Refetch ($ids: [ID!]!) {
  loadRemoteFetchables(ids: $ids){
    id
    fetchingStatus
  }
}
`

const refetchMutation = useMutation(CloudData_RefetchDocument)

const isProjectDisconnected = computed(() => props.gql.cloudViewer?.id === undefined || (props.gql.currentProject?.cloudProject?.__typename !== 'CloudProject'))

const refetch = async (ids: string[]) => {
  if (!isProjectDisconnected.value && !refetchMutation.fetching.value) {
    await refetchMutation.executeMutation({ ids })
  }
}

type CloudSpecItem = {
  fetchingStatus?: RemoteFetchableStatus
  data?: {
    __typename?: 'CloudProjectSpec'
    retrievedAt: string | null
  } | {
    __typename?: 'CloudProjectSpecNotFound'
    retrievedAt: string | null
  } | {
    __typename?: 'CloudProjectUnauthorized'
  } | null
}

function shouldRefetch (item: CloudSpecItem) {
  if (isOffline.value) {
    // Offline, no need to refetch

    return false
  }

  if (item.fetchingStatus === 'NOT_FETCHED' || item.fetchingStatus === undefined) {
    // NOT_FETCHED, refetch

    return true
  }

  if (props.mostRecentUpdate) {
    if (
      (
        item.data?.__typename === 'CloudProjectSpecNotFound' ||
        item.data?.__typename === 'CloudProjectSpec'
      )
      && (
        item.data.retrievedAt &&
        props.mostRecentUpdate > item.data.retrievedAt
      )
    ) {
      // outdated, refetch

      return true
    }
  }

  // nothing new, no need to refetch

  return false
}

type NonNullCloudSpec = Exclude<SpecsListFragment['cloudSpec'], undefined | null>

function getIdsToRefetch () {
  return list.value
  .map((spec) => spec.data.data?.cloudSpec)
  .filter((cloudSpec): cloudSpec is NonNullCloudSpec => Boolean(cloudSpec && shouldRefetch(cloudSpec)))
  .map((cloudSpec) => cloudSpec.id)
  ?? []
}
async function fetchMissingOrErroneousItems () {
  const cloudSpecIds = getIdsToRefetch()

  if (cloudSpecIds.length > 0) {
    await refetch(cloudSpecIds)
  }
}

const displayedSpecIds = computed(() => list.value.map((v) => v.data.data?.cloudSpec?.id).join('|'))

const debouncedDisplayedSpecIds = useDebounce(displayedSpecIds, 200)

watch([debouncedDisplayedSpecIds, isOnline, isProjectDisconnected, () => props.mostRecentUpdate], fetchMissingOrErroneousItems)

async function refetchFailedCloudData () {
  const latestRunsIds = props.gql.currentProject?.specs
  .map((s) => s.cloudSpec)
  .filter((cloudSpec): cloudSpec is NonNullCloudSpec => Boolean(cloudSpec?.fetchingStatus === 'ERRORED'))
  .map((cloudSpec) => cloudSpec.id) ?? []

  await refetchMutation.executeMutation({ ids: [...latestRunsIds] })
}

function refreshPage () {
  location.reload()
}

</script>

<style scoped>
/** h-[calc] was getting dropped so moved to styles. Virtual list requires defined height */

/** Header is 64px */
.spec-container {
  height: calc(100vh - 64px);
}

/** Search bar is 72px + List header is 40px = 112px offset */
.spec-list-container {
  height: calc(100% - 112px)
}
</style>
