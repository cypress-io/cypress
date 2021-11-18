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

    <div class="grid items-center divide-y-1 children:h-40px">
      <div class="grid grid-cols-2 children:text-gray-800 children:font-medium">
        <div class="flex justify-between items-center">
          {{ t('specPage.componentSpecsHeader') }}
        </div>
        <div class="flex justify-between items-center">
          <div>{{ t('specPage.gitStatusHeader') }}</div>
        </div>
      </div>
      <template
        v-for="(row, idx) in treeSpecList"
        :key="idx"
      >
        <SpecsListRowItem>
          <template #file>
            <RouterLink
              v-if="row.isLeaf && row.data"
              :key="row.data.absolute"
              :to="{ path: 'runner', query: { file: row.data?.relative } }"
            >
              <SpecItem
                :file-name="row.data?.fileName || row.name"
                :extension="row.data?.specFileExtension || ''"
                :indexes="getIndexes(row)"
                :style="{ paddingLeft: `${((row.depth - 2) * 10) + 16 + 22}px` }"
              />
            </RouterLink>
            <RowDirectory
              v-else
              :name="row.name"
              :expanded="row.expanded.value"
              :depth="row.depth - 2"
              :style="{ paddingLeft: `${((row.depth - 2) * 10) + 16}px` }"
              :indexes="getIndexes(row)"
              @click="row.toggle"
            />
          </template>
          <template #git-info>
            <SpecListGitInfo
              v-if="row.data?.gitInfo"
              :gql="row.data.gitInfo"
            />
          </template>
        </SpecsListRowItem>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import SpecsListHeader from './SpecsListHeader.vue'
import SpecListGitInfo from './SpecListGitInfo.vue'
import SpecsListRowItem from './SpecsListRowItem.vue'
import { gql } from '@urql/vue'
import { computed, ref } from 'vue'
import CreateSpecModal from './CreateSpecModal.vue'
import type { Specs_SpecsListFragment, SpecListRowFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { buildSpecTree, FuzzyFoundSpec, getIndexes } from '@packages/frontend-shared/src/utils/spec-utils'
import { useCollapsibleTree } from '@packages/frontend-shared/src/composables/useCollapsibleTree'
import RowDirectory from './RowDirectory.vue'
import SpecItem from './SpecItem.vue'
import fuzzySort from 'fuzzysort'

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
  const specs = props.gql.currentProject?.specs?.edges
  .map((x) => ({ ...x.node, indexes: [] })) || []

  if (!search.value) {
    return specs
  }

  return fuzzySort
  .go(search.value, specs || [], { key: 'relative' })
  .map(({ obj, indexes }) => ({ ...obj, indexes }))
})

const specTree = computed(() => buildSpecTree<FuzzyFoundSpec & { gitInfo: SpecListRowFragment }>(specs.value))
const collapsible = computed(() => useCollapsibleTree(specTree.value, { dropRoot: true }))

const treeSpecList = computed(() => collapsible.value.tree.filter(((item) => !item.hidden.value)))
</script>
