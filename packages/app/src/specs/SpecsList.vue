<template>
  <div class="p-24px spec-container">
    <CreateSpecModal
      v-if="props.gql.currentProject?.currentTestingType"
      :show="showModal"
      :gql="props.gql"
      @close="showModal = false"
    />
    <SpecsListHeader
      v-model="search"
      class="pb-32px"
      :result-count="specs?.length"
      @newSpec="showModal = true"
    />

    <div class="grid grid-cols-2 children:font-medium children:text-gray-800">
      <div
        class="flex justify-between items-center"
        data-cy="specs-testing-type-header"
      >
        {{ props.gql.currentProject?.currentTestingType === 'component' ?
          t('specPage.componentSpecsHeader') : t('specPage.e2eSpecsHeader') }}
      </div>
      <div class="flex justify-between items-center">
        <div>{{ t('specPage.gitStatusHeader') }}</div>
      </div>
    </div>
    <div
      class="grid pb-32px spec-list-container"
      v-bind="containerProps"
    >
      <div
        v-bind="wrapperProps"
        class="divide-y-1 children:h-40px"
      >
        <SpecsListRowItem
          v-for="row in list"
          :key="row.index"
        >
          <template #file>
            <RouterLink
              v-if="row.data.isLeaf && row.data"
              :key="row.data.data?.absolute"
              :to="{ path: '/specs/runner', query: { file: row.data.data?.relative } }"
            >
              <SpecItem
                :file-name="row.data.data?.fileName || row.data.name"
                :extension="row.data.data?.specFileExtension || ''"
                :indexes="row.data.data?.fileIndexes"
                :style="{ paddingLeft: `${((row.data.depth - 2) * 10) + 16 + 22}px` }"
              />
            </RouterLink>

            <RowDirectory
              v-else
              :name="row.data.name"
              :expanded="treeSpecList[row.index].expanded.value"
              :depth="row.data.depth - 2"
              :style="{ paddingLeft: `${((row.data.depth - 2) * 10) + 16}px` }"
              :indexes="getDirIndexes(row.data)"
              @click="row.data.toggle"
            />
          </template>

          <template #git-info>
            <SpecListGitInfo
              v-if="row.data.data?.gitInfo"
              :gql="row.data.data.gitInfo"
            />
          </template>
        </SpecsListRowItem>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SpecsListHeader from './SpecsListHeader.vue'
import SpecListGitInfo from './SpecListGitInfo.vue'
import SpecsListRowItem from './SpecsListRowItem.vue'
import { gql } from '@urql/vue'
import { computed, ref, watch } from 'vue'
import CreateSpecModal from './CreateSpecModal.vue'
import type { Specs_SpecsListFragment, SpecListRowFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { buildSpecTree, FuzzyFoundSpec, fuzzySortSpecs, getDirIndexes, makeFuzzyFoundSpec, useCachedSpecs } from '@packages/frontend-shared/src/utils/spec-utils'
import { useCollapsibleTree } from '@packages/frontend-shared/src/composables/useCollapsibleTree'
import RowDirectory from './RowDirectory.vue'
import SpecItem from './SpecItem.vue'
import { useVirtualList } from '@packages/frontend-shared/src/composables/useVirtualList'

const { t } = useI18n()

gql`
fragment SpecNode_SpecsList on SpecEdge {
  node {
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
  }
}
`

gql`
fragment Specs_SpecsList on Query {
  ...CreateSpecModal
  currentProject {
    id
    projectRoot
    currentTestingType
    specs: specs(first: 100) {
      edges {
        ...SpecNode_SpecsList
      }
    }
  }
}
`

const props = defineProps<{
  gql: Specs_SpecsListFragment
}>()

const showModal = ref(false)
const search = ref('')
const cachedSpecs = useCachedSpecs(computed(() => props.gql.currentProject?.specs?.edges || []))

const specs = computed(() => {
  const specs = cachedSpecs.value.map((x) => makeFuzzyFoundSpec(x.node))

  if (!search.value) {
    return specs
  }

  return fuzzySortSpecs(specs, search.value)
})

const collapsible = computed(() => useCollapsibleTree(buildSpecTree<FuzzyFoundSpec & { gitInfo: SpecListRowFragment }>(specs.value), { dropRoot: true }))
const treeSpecList = computed(() => collapsible.value.tree.filter(((item) => !item.hidden.value)))

const { containerProps, list, wrapperProps, scrollTo } = useVirtualList(treeSpecList, { itemHeight: 40, overscan: 10 })

// If you are scrolled down the virtual list and list changes,
// reset scroll position to top of list
watch(() => treeSpecList.value, () => scrollTo(0))
</script>

<style scoped>
/** h-[calc] was getting dropped so moved to styles. Virtual list requires defined height */

/** Header is 64px */
.spec-container {
  height: calc(100vh - 64px);
}

/** List header is 72px */
.spec-list-container {
  height: calc(100% - 72px)
}
</style>
