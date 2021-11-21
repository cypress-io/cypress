<template>
  <div class="p-24px">
    <CreateSpecModal
      v-if="props.gql.currentProject?.currentTestingType"
      :show="showModal"
      :gql="props.gql"
      @close="showModal = false"
    />
    <SpecsListHeader
      v-model="search"
      class="pb-32px"
      @newSpec="showModal = true"
    />

    <div class="grid grid-cols-2 children:text-gray-800 children:font-medium">
      <div class="flex justify-between items-center">
        {{ t('specPage.componentSpecsHeader') }}
      </div>
      <div class="flex justify-between items-center">
        <div>{{ t('specPage.gitStatusHeader') }}</div>
      </div>
    </div>
    <div
      class="grid"
      v-bind="containerProps"
    >
      <div
        v-bind="wrapperProps"
        class="divide-y-1 children:h-40px"
      >
        <SpecsListRowItem
          v-for="row in list"
          :key="row.index"
          style="height: 40px"
        >
          <template #file>
            <RouterLink
              v-if="row.data.isLeaf && row.data"
              :key="row.data.data?.absolute"
              :to="{ path: 'runner', query: { file: row.data.data?.relative } }"
            >
              <SpecItem
                :file-name="row.data.data?.fileName || row.data.name"
                :extension="row.data.data?.specFileExtension || ''"
                :indexes="getIndexes(row.data)"
                :style="{ paddingLeft: `${((row.data.depth - 2) * 10) + 16 + 22}px` }"
              />
            </RouterLink>

            <RowDirectory
              v-else
              :name="row.data.name"
              :expanded="row.data.expanded.value"
              :depth="row.data.depth - 2"
              :style="{ paddingLeft: `${((row.data.depth - 2) * 10) + 16}px` }"
              :indexes="getIndexes(row.data)"
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
import { computed, ComputedRef, ref, watch } from 'vue'
import CreateSpecModal from './CreateSpecModal.vue'
import type { Specs_SpecsListFragment, SpecListRowFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { buildSpecTree, FuzzyFoundSpec, getIndexes } from '@packages/frontend-shared/src/utils/spec-utils'
import { useCollapsibleTree } from '@packages/frontend-shared/src/composables/useCollapsibleTree'
import RowDirectory from './RowDirectory.vue'
import SpecItem from './SpecItem.vue'
import fuzzySort from 'fuzzysort'
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

const specs = computed(() => {
  const specs = props.gql.currentProject?.specs?.edges.map((x) => x.node) || []

  if (!search.value) {
    return specs.map((spec) => ({ ...spec, indexes: [] as number[] }))
  }

  return fuzzySort
  .go(search.value, specs || [], { key: 'relative' })
  .map(({ obj, indexes }) => ({ ...obj, indexes }))
})

const specTree = computed(() => buildSpecTree<FuzzyFoundSpec & { gitInfo: SpecListRowFragment }>(specs.value))
const collapsible = computed(() => useCollapsibleTree(specTree.value, { dropRoot: true }))

const treeSpecList = computed(() => collapsible.value.tree.filter(((item) => !item.hidden.value)))

const { containerProps, list, wrapperProps } = useVirtualList(treeSpecList, { itemHeight: 40, overscan: 10 })
</script>
