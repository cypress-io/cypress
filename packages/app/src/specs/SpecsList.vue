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
    <button @click="toggle">toggle</button>

    <div class="grid items-center divide-y-1 children:h-40px">
      <div class="grid grid-cols-2 children:text-gray-800 children:font-medium">
        <div>{{ t('specPage.componentSpecsHeader') }}</div>
        <div>{{ t('specPage.gitStatusHeader') }}</div>
      </div>

      <template v-if="specViewType === 'flat'">
        <RouterLink
          v-for="spec in flatSpecList"
          :key="spec.node.id"
          class="text-left"
          :to="{ path: 'runner', query: { file: spec.node.relative } }"
        >
          <SpecsListRowItem>
            <template v-slot:file>
              <SpecItem :spec="spec.node" />
            </template>

            <template v-slot:git-info>
              <SpecListGitInfo 
                v-if="spec.node.gitInfo"
                :gql="spec.node.gitInfo"
              />
            </template>
          </SpecsListRowItem>
        </RouterLink>
      </template>

      <template v-if="specViewType === 'tree'">
        <template v-for="row in treeSpecList">
          <SpecsListRowItem>
            <template v-slot:file>
              <SpecItem 
                v-if="row.isLeaf && row.data"
                :spec="row.data" 
                :style="{ paddingLeft: `${((row.depth - 2) * 20) + 16}px` }"
              />

              <RowDirectory 
                v-else
                :directories="row.value.split('/')"
                :expanded="row.expanded.value"
                :style="{ paddingLeft: `${((row.depth - 2) * 20) + 16}px` }"
              />
            </template>

            <template v-slot:git-info>
              <SpecListGitInfo 
                v-if="row.data?.gitInfo"
                :gql="row.data.gitInfo"
              />
            </template>
          </SpecsListRowItem>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import SpecsListHeader from './SpecsListHeader.vue'
import SpecListGitInfo from './SpecsListRow.vue'
import SpecsListRowItem from './SpecsListRowItem.vue'
import { gql } from '@urql/vue'
import { computed, ref } from 'vue'
import CreateSpecModal from './CreateSpecModal.vue'
import type { Specs_SpecsListFragment, SpecNode_SpecsListFragment, SpecListRowFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { buildSpecTree } from '@packages/frontend-shared/src/utils/buildSpecTree'
import { useCollapsibleTree } from '@packages/frontend-shared/src/composables/useCollapsibleTree'
import DirectoryItem from './DirectoryItem.vue'
import RowDirectory from './RowDirectory.vue'
import SpecItem from './SpecItem.vue'
import type { FoundSpec } from '@packages/types/src'

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

type SpecViewType = 'flat' | 'tree'

const props = defineProps<{
  gql: Specs_SpecsListFragment
}>()

const showModal = ref(false)
const search = ref('')
const specViewType = ref<SpecViewType>('flat')

const toggle = () => {
  specViewType.value = specViewType.value === 'flat' ? 'tree' : 'flat'
}

const flatSpecList = computed(() => props.gql.currentProject?.specs?.edges)

const treeSpecList = computed(() => {
  const specTree = buildSpecTree<FoundSpec & { gitInfo: SpecListRowFragment }>(props.gql.currentProject?.specs?.edges.map(x => x.node) || [])
  const collapsible = useCollapsibleTree(specTree, { dropRoot: true })
  return collapsible.tree.filter(((item) => !item.hidden.value))
})

// If this search becomes any more complex, push it into the server
// const sortByGitStatus = (
//   a: SpecNode_SpecsListFragment,
//   b: SpecNode_SpecsListFragment,
// ) => {
//   return a.node.gitInfo ? 1 : -1
// }
// const filteredSpecs = computed(() => {
//   return specs.value?.filter((s) => {
//     return s.node.relative.toLowerCase().includes(search.value.toLowerCase())
//   })?.sort(sortByGitStatus)
// })
</script>
