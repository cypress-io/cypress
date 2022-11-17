<script lang="ts" setup>
import {
  deriveSpecTree,
  fuzzySortSpecs,
  getAllFileInDirectory,
} from './tree/deriveTree'
import type { SpecListOptions, SpecTreeDirectoryNode } from './tree/deriveTree'
import type { ProjectConnectionStatus } from './tree/types'
import type {
  SpecsListFragment,
  Specs_SpecsListFragment,
} from '../generated/graphql'
import { computed, reactive, ref } from 'vue'
import SpecsListDirectory from './SpecsList/SpecsListDirectory.vue'
import { getPlatform } from './tree/useCollapsibleTree'
import SpecsListHeader from './SpecsListHeader.vue'
import SpecsListTableHeader from './SpecsList/SpecsListTableHeader.vue'
import { useSpecFilter } from '../composables/useSpecFilter'
import NoResults from '@cy/components/NoResults.vue'
import { useI18n } from '@cy/i18n'
import { useCloudSpecData } from '../composables/useCloudSpecData'
import SpecsListBanners from './SpecsListBanners.vue'
import { useRoute } from 'vue-router'
import SpecPatternModal from '../components/SpecPatternModal.vue'

const props = defineProps<{
  gql: Specs_SpecsListFragment
}>()

const opts = reactive<SpecListOptions<SpecsListFragment>>({
  sep: '/',
  collapsedDirs: new Set(),
  searchFn: fuzzySortSpecs,
})

defineEmits<{
  (e: 'showCreateSpecModal'): void
}>()

const handleCollapse = (node: SpecTreeDirectoryNode<SpecsListFragment>) => {
  const contained = opts.collapsedDirs.has(node.relative)

  if (contained) {
    opts.collapsedDirs = new Set(
      [...opts.collapsedDirs.values()].filter((x) => x !== node.relative),
    )
  } else {
    opts.collapsedDirs = new Set([
      ...opts.collapsedDirs.values(),
      node.relative,
    ])
  }
}

const cloudProjectType = computed(
  () => props.gql.currentProject?.cloudProject?.__typename,
)

const isProjectDisconnected = computed(
  () => {
    return props.gql.cloudViewer?.id === undefined ||
    cloudProjectType.value !== 'CloudProject'
  },
)
const isOffline = ref(false)
const showSpecPatternModal = ref(false)
const mostRecentUpdateRef = ref(null) // toRef(props.gql, 'mostRecentUpdate')

const specs = computed(() => {
  return props.gql.currentProject?.specs.slice() ?? []
})

const { refetchFailedCloudData } = useCloudSpecData(
  isProjectDisconnected,
  isOffline,
  props.gql.currentProject?.projectId,
  mostRecentUpdateRef,
  specs,
  // displayedSpecs,
  specs.value,
  // props.gql.currentProject?.specs as SpecsListFragment[] || [],
)

const projectConnectionStatus = computed<ProjectConnectionStatus>(() => {
  if (!props.gql.cloudViewer) return 'LOGGED_OUT'

  if (!props.gql.currentProject?.cloudProject?.__typename) {
    return 'NOT_CONNECTED'
  }

  if (
    props.gql.currentProject?.cloudProject?.__typename ===
    'CloudProjectNotFound'
  ) {
    return 'NOT_FOUND'
  }

  if (
    props.gql.currentProject?.cloudProject?.__typename ===
    'CloudProjectUnauthorized'
  ) {
    if (props.gql.currentProject?.cloudProject?.hasRequestedAccess) {
      return 'ACCESS_REQUESTED'
    }

    return 'UNAUTHORIZED'
  }

  return 'CONNECTED'
})

const normalizedSearchValue = (str: string = '') => {
  return getPlatform() === 'win32' ? str.replaceAll('/', '\\') : str
}

const tree = computed(() => {
  return deriveSpecTree(specs.value, {
    ...opts,
    search: normalizedSearchValue(debouncedSpecFilterModel.value),
  })
})

const { debouncedSpecFilterModel, specFilterModel } = useSpecFilter(
  props.gql.currentProject?.savedState?.specFilter,
)

const specsListInputRef = ref<HTMLInputElement>()

const route = useRoute()

const isSpecNotFound = ref(!!route.params?.unrunnable)
const shouldShowFetchError = ref(false)

const hasRequestedAccess = computed(() => {
  return projectConnectionStatus.value === 'ACCESS_REQUESTED'
})

const specsListInputRefFn = () => specsListInputRef

function handleClear () {
  specFilterModel.value = ''
  specsListInputRef.value?.focus()
}

const { t } = useI18n()
// result count is always count of files from root node
const resultCount = computed(
  () => getAllFileInDirectory(tree.value.root).length,
)
</script>

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
      :result-count="resultCount"
      :spec-count="specs.length"
    />

    <SpecPatternModal
      v-if="props.gql.currentProject"
      :show="showSpecPatternModal"
      :gql="props.gql.currentProject"
      @close="showSpecPatternModal = false"
    />

    <SpecsListTableHeader
      v-if="specs.length"
      :gql="props.gql"
    />
    <!-- @show-create-spec-modal="emit('showCreateSpecModal')"
    @show-spec-pattern-modal="showSpecPatternModal = true" -->
    <div
      class="divide-y-1 border-gray-50 border-y-1 children:border-gray-50 children:h-40px"
    >
      <SpecsListDirectory
        :node="tree.root"
        :handle-collapse="handleCollapse"
        :project-connection-status="projectConnectionStatus"
        :project-id="props.gql.currentProject?.projectId ?? undefined"
      />
    </div>
    <NoResults
      v-show="resultCount === 0"
      :search-term="specFilterModel"
      :message="t('specPage.noResultsMessage')"
      class="mt-56px"
      @clear="handleClear"
    />
  </div>
</template>
