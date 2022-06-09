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
        {{ t('specPage.fetchFailedWarning.explainer2') }}
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
      class="mb-4 grid grid-cols-7 children:font-medium children:text-gray-800"
      :style="`padding-right: ${scrollbarOffset}px`"
    >
      <div
        class="flex col-span-3 items-center justify-between"
        data-cy="specs-testing-type-header"
      >
        {{ props.gql.currentProject?.currentTestingType === 'component' ?
          t('specPage.componentSpecsHeader') : t('specPage.e2eSpecsHeader') }}
      </div>
      <div class="flex col-span-2 items-center justify-between">
        <LastUpdatedHeader :is-git-available="isGitAvailable" />
      </div>
      <div class="flex items-center justify-end">
        <SpecHeaderCloudDataTooltip
          :gql="props.gql"
          :header-text="t('specPage.latestRuns.header')"
          :connected-text="t('specPage.latestRuns.tooltip.connected')"
          :not-connected-text="t('specPage.latestRuns.tooltip.notConnected')"
          @showLogin="showLogin"
          @showConnectToProject="showConnectToProject"
        />
      </div>
      <div class="flex items-center justify-end">
        <SpecHeaderCloudDataTooltip
          :gql="props.gql"
          :header-text="t('specPage.averageDuration.header')"
          :connected-text="t('specPage.averageDuration.tooltip.connected')"
          :not-connected-text="t('specPage.averageDuration.tooltip.notConnected')"
          @showLogin="showLogin"
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
        class="divide-y-1 children:h-40px"
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
            <!-- <div>
              <pre>{{ JSON.stringify(row.data.data?.cloudSpec?.data?.specRuns?.nodes?.length ?? "null",null,2) }}</pre>
            </div> -->
            <RunStatusDots
              v-if="row.data.isLeaf && row.data.data"
              :gql="row.data.data"
              :is-project-disconnected="props.gql.cloudViewer?.id === undefined || (props.gql.currentProject?.cloudProject?.__typename !== 'CloudProject')"
              :is-online="isOnline"
              :most-recent-update="mostRecentUpdate"
            />
          </template>
          <template #average-duration>
            <AverageDuration
              v-if="row.data.isLeaf"
              :gql="row.data.data ?? null"
              :is-project-disconnected="props.gql.cloudViewer?.id === undefined || (props.gql.currentProject?.cloudProject?.__typename !== 'CloudProject')"
              :is-online="isOnline"
              :most-recent-update="mostRecentUpdate"
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
    @loggedin="refreshPage"
  />
  <CloudConnectModals
    v-if="isProjectConnectOpen"
    :gql="props.gql"
    @cancel="isProjectConnectOpen = false"
    @success="isProjectConnectOpen = false; refreshPage()"
  />
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import LastUpdatedHeader from './LastUpdatedHeader.vue'
import SpecHeaderCloudDataTooltip from './SpecHeaderCloudDataTooltip.vue'
import LoginModal from '@cy/gql-components/topnav/LoginModal.vue'
import CloudConnectModals from '../runs/modals/CloudConnectModals.vue'
import SpecsListHeader from './SpecsListHeader.vue'
import SpecListGitInfo from './SpecListGitInfo.vue'
import RunStatusDots from './RunStatusDots.vue'
import AverageDuration from './AverageDuration.vue'
import SpecsListRowItem from './SpecsListRowItem.vue'
import { gql, useMutation, useSubscription } from '@urql/vue'
import { computed, ref, watch } from 'vue'
import { Specs_SpecsListFragment, SpecsList_GitInfoUpdatedDocument, SpecsListFragment } from '../generated/graphql'
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
import { CloudData_RefetchDocument } from '../generated/graphql-test'

const route = useRoute()
const { t } = useI18n()

const isOnline = useOnline()
const isOffline = ref(false)

watch(isOnline, (newIsOnlineValue) => isOffline.value = !newIsOnlineValue)

const isProjectConnectOpen = ref(false)
const isLoginOpen = ref(false)

const showLogin = () => {
  isLoginOpen.value = true
}

const showConnectToProject = () => {
  isProjectConnectOpen.value = true
}

const isGitAvailable = computed(() => {
  return props.gql.currentProject?.specs.some((s) => s.gitInfo?.statusType === 'noGitInfo') ?? false
})

const hasCloudErrors = computed(() => {
  return props.gql.currentProject?.specs.some((s) => s.cloudSpec?.fetchingStatus === 'ERRORED' || s.avgDurationInfo?.fetchingStatus === 'ERRORED') ?? false
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
  ...RunStatusDots
  ...AverageDuration
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
  const specs2 = cachedSpecs.value.map((x) => {
    const s = makeFuzzyFoundSpec(x)

    return s
  })

  if (!debouncedSearchString.value) {
    return specs2
  }

  return fuzzySortSpecs(specs2, debouncedSearchString.value)
})

const collapsible = computed(() => {
  return useCollapsibleTree(
    buildSpecTree<FuzzyFoundSpec<SpecsListFragment>>(specs.value), { dropRoot: true },
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

// If you are scrolled down the virtual list and list changes,
// reset scroll position to top of list
watch(() => treeSpecList.value, () => scrollTo(0))

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

function refetchFailedCloudData () {
  const latestRunsIds = props.gql.currentProject?.specs
  .filter((s) => s.cloudSpec?.fetchingStatus === 'ERRORED')
  .map((s) => s.cloudSpec?.id as string) ?? []

  const avgInfoIds = props.gql.currentProject?.specs
  .filter((s) => s.avgDurationInfo?.fetchingStatus === 'ERRORED')
  .map((s) => s.avgDurationInfo?.id as string) ?? []

  refetchMutation.executeMutation({ ids: [...avgInfoIds, ...latestRunsIds] })
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
