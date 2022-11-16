<template>
  <div class="p-24px spec-container">
    <SpecsListBanners
      :gql="props.gql"
      :is-spec-not-found="isSpecNotFound"
      :is-offline="isOffline"
      :is-fetch-error="shouldShowFetchError"
      :is-project-not-found="cloudProjectType === 'CloudProjectNotFound'"
      :is-project-unauthorized="cloudProjectType === 'CloudProjectUnauthorized'"
      :has-requested-access="hasRequestedAccess"
      @refetch-failed-cloud-data="refetchFailedCloudData"
    />
    <SpecsListHeader
      v-model="specFilterModel"
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
      class="mb-4 grid children:font-medium children:text-gray-800"
      :style="`padding-right: ${scrollbarOffset + 20}px`"
      :class="tableGridColumns"
    >
      <div
        class="flex items-center justify-between"
        data-cy="specs-testing-type-header"
      >
        {{ props.gql.currentProject?.currentTestingType === 'component' ?
          t('specPage.componentSpecsHeader') : t('specPage.e2eSpecsHeader') }}
      </div>
      <div class="flex items-center justify-between truncate">
        <LastUpdatedHeader :is-git-available="isGitAvailable" />
      </div>
      <div class="flex items-center justify-end whitespace-nowrap">
        <SpecHeaderCloudDataTooltip
          :gql="props.gql"
          mode="LATEST_RUNS"
          data-cy="latest-runs-header"
          @showLoginConnect="openLoginConnectModal({utmMedium: 'Specs Latest Runs Tooltip'})"
        />
      </div>
      <div class="hidden items-center justify-end truncate md:flex">
        <SpecHeaderCloudDataTooltip
          :gql="props.gql"
          mode="AVG_DURATION"
          data-cy="average-duration-header"
          @showLoginConnect="openLoginConnectModal({utmMedium: 'Specs Average Duration Tooltip'})"
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
          :is-project-connected="projectConnectionStatus === 'CONNECTED'"
          :grid-columns="tableGridColumns"
          :route="{ path: '/specs/runner', query: { file: row.data.data?.relative?.replace(/\\/g, '/') } }"
          @toggleRow="row.data.toggle"
        >
          <template #file>
            <SpecItem
              v-if="row.data.isLeaf"
              :file-name="row.data.data?.fileName || row.data.name"
              :extension="row.data.data?.specFileExtension || ''"
              :indexes="row.data.highlightIndexes"
              :style="{ paddingLeft: `${((row.data.depth - 2) * 10) + 22}px` }"
            >
              <span class="ml-2 inline-block">
                <FlakyInformation
                  :project-gql="props.gql.currentProject"
                  :spec-gql="row.data.data"
                  :cloud-spec-gql="row.data.data?.cloudSpec"
                />
              </span>
            </SpecItem>

            <RowDirectory
              v-else
              :name="row.data.name"
              :expanded="treeSpecList[row.index].expanded.value"
              :depth="row.data.depth - 2"
              :style="{ paddingLeft: `${(row.data.depth - 2) * 10}px` }"
              :indexes="row.data.highlightIndexes"
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

          <template #connect-button="{ utmMedium }">
            <SpecsListCloudButton
              v-if="projectConnectionStatus !== 'CONNECTED' && row.data.isLeaf && row.data.data && (row.data.data.cloudSpec?.data || row.data.data.cloudSpec?.fetchingStatus !== 'FETCHING')"
              :gql="props.gql"
              :project-connection-status="projectConnectionStatus"
              @show-login-connect="openLoginConnectModal({ utmMedium })"
              @request-access="requestAccess(props.gql?.currentProject?.projectId)"
            />
          </template>

          <template #latest-runs>
            <div
              class="h-full grid justify-items-end items-center relative"
            >
              <RunStatusDots
                v-if="row.data.isLeaf && row.data.data && (row.data.data.cloudSpec?.data || row.data.data.cloudSpec?.fetchingStatus !== 'FETCHING')"
                :gql="row.data.data.cloudSpec ?? null"
                :spec-file-extension="row.data.data.specFileExtension"
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
      :search-term="specFilterModel"
      :message="t('specPage.noResultsMessage')"
      class="mt-56px"
      @clear="handleClear"
    />
  </div>
</template>

<script setup lang="ts">
import SpecsListBanners from './SpecsListBanners.vue'
import LastUpdatedHeader from './LastUpdatedHeader.vue'
import SpecHeaderCloudDataTooltip from './SpecHeaderCloudDataTooltip.vue'
import SpecsListCloudButton from './SpecsListCloudButton.vue'
import SpecsListHeader from './SpecsListHeader.vue'
import SpecListGitInfo from './SpecListGitInfo.vue'
import RunStatusDots from './RunStatusDots.vue'
import AverageDuration from './AverageDuration.vue'
import SpecsListRowItem from './SpecsListRowItem.vue'
import { gql, useSubscription } from '@urql/vue'
import { computed, ref, toRef, watch } from 'vue'
import { Specs_SpecsListFragment, SpecsList_GitInfoUpdatedDocument, SpecsListFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { buildSpecTree, FuzzyFoundSpec, useCollapsibleTree } from './tree/useCollapsibleTree'
import { fuzzySortSpecs, makeFuzzyFoundSpec, useCachedSpecs } from './spec-utils'
import RowDirectory from './RowDirectory.vue'
import SpecItem from './SpecItem.vue'
import { useVirtualList } from './tree/useVirtualList'
import NoResults from '@cy/components/NoResults.vue'
import SpecPatternModal from '../components/SpecPatternModal.vue'
import { useOnline, useResizeObserver } from '@vueuse/core'
import { useRoute } from 'vue-router'
import FlakyInformation from './flaky-badge/FlakyInformation.vue'
import { useCloudSpecData } from '../composables/useCloudSpecData'
import { useSpecFilter } from '../composables/useSpecFilter'
import { useRequestAccess } from '../composables/useRequestAccess'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'

const { openLoginConnectModal } = useLoginConnectStore()

const route = useRoute()
const { t } = useI18n()

const isOnline = useOnline()
const isOffline = ref(false)

watch(isOnline, (newIsOnlineValue) => isOffline.value = !newIsOnlineValue, { immediate: true })

const tableGridColumns = 'grid-cols-[1fr,135px,130px] md:grid-cols-[1fr,135px,130px,130px] lg:grid-cols-[1fr,160px,160px,180px]'

const projectConnectionStatus = computed(() => {
  if (!props.gql.cloudViewer) return 'LOGGED_OUT'

  if (!props.gql.currentProject?.cloudProject?.__typename) return 'NOT_CONNECTED'

  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectNotFound') return 'NOT_FOUND'

  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized') {
    if (props.gql.currentProject?.cloudProject?.hasRequestedAccess) {
      return 'ACCESS_REQUESTED'
    }

    return 'UNAUTHORIZED'
  }

  return 'CONNECTED'
})

const cloudProjectType = computed(() => props.gql.currentProject?.cloudProject?.__typename)

const hasRequestedAccess = computed(() => {
  return projectConnectionStatus.value === 'ACCESS_REQUESTED'
})

const requestAccess = useRequestAccess()

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
    ...FlakyInformationCloudSpec
    ...RunStatusDots
  }
  ...FlakyInformationSpec
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
    savedState
    ...SpecPatternModal
    ...FlakyInformationProject
  }
  ...SpecHeaderCloudDataTooltip
  ...SpecsListBanners
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

const isSpecNotFound = ref(!!route.params?.unrunnable)

const cachedSpecs = useCachedSpecs(
  computed(() => props.gql.currentProject?.specs ?? []),
)

const { debouncedSpecFilterModel, specFilterModel } = useSpecFilter(props.gql.currentProject?.savedState?.specFilter)

const specsListInputRef = ref<HTMLInputElement>()

const specsListInputRefFn = () => specsListInputRef

function handleClear () {
  specFilterModel.value = ''
  specsListInputRef.value?.focus()
}

const specs = computed(() => {
  const fuzzyFoundSpecs = cachedSpecs.value.map(makeFuzzyFoundSpec)

  if (!debouncedSpecFilterModel?.value) {
    return fuzzyFoundSpecs
  }

  return fuzzySortSpecs(fuzzyFoundSpecs, debouncedSpecFilterModel.value)
})

// Maintain a cache of what tree directories are expanded/collapsed so the tree state is visually preserved
// when specs list data is updated on scroll (e.g., latest-runs & average-duration data loading async)
const treeExpansionCache = ref(new Map<string, boolean>())

// When search value changes or when specs are added/removed, reset the tree expansion cache so that any collapsed directories re-expand
watch([() => specFilterModel.value, () => specs.value.length], () => treeExpansionCache.value.clear())

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

watch(() => debouncedSpecFilterModel?.value, () => {
  // If you are scrolled down the virtual list and the search filter changes,
  // reset scroll position to top of list
  scrollTo(0)
})

function getIdIfDirectory (row) {
  if (row.data.isLeaf && row.data) {
    return undefined
  }

  return `speclist-${row.data.data.relative.replace(row.data.data.baseName, '')}`
}

const isProjectDisconnected = computed(() => props.gql.cloudViewer?.id === undefined || (cloudProjectType.value !== 'CloudProject'))

const displayedSpecs = computed(() => list.value.map((v) => v.data.data))

const mostRecentUpdateRef = toRef(props, 'mostRecentUpdate')

const { refetchFailedCloudData } = useCloudSpecData(
  isProjectDisconnected,
  isOffline,
  props.gql.currentProject?.projectId,
  mostRecentUpdateRef,
  displayedSpecs,
  props.gql.currentProject?.specs as SpecsListFragment[] || [],
)

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
