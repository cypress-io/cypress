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
          <SelectSpecListView
            :model-value="specViewType"
            class="flex border-1 border-gray-900 rounded-md h-24px w-64px text-md cursor-pointer"
            @update:tab="updateTab"
          />
        </div>
      </div>

      <template v-if="specViewType === 'flat'">
        <RouterLink
          v-for="spec in flatSpecList"
          :key="spec.node.id"
          class="text-left"
          :to="{ path: 'runner', query: { file: spec.node.relative } }"
        >
          <SpecsListRowItem>
            <template #file>
              <SpecItem :spec="spec.node" />
            </template>

            <template #git-info>
              <SpecListGitInfo
                v-if="spec.node.gitInfo"
                :gql="spec.node.gitInfo"
              />
            </template>
          </SpecsListRowItem>
        </RouterLink>
      </template>

      <template v-if="specViewType === 'tree'">
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
                  :spec="row.data"
                  :style="{ paddingLeft: `${((row.depth - 2) * 20) + 16}px` }"
                />
              </RouterLink>

              <RowDirectory
                v-else
                :directories="row.value.split('/')"
                :expanded="row.expanded.value"
                :depth="row.depth - 2"
                :style="{ paddingLeft: `${((row.depth - 2) * 20) + 16}px` }"
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
import { buildSpecTree } from '@packages/frontend-shared/src/utils/buildSpecTree'
import { useCollapsibleTree } from '@packages/frontend-shared/src/composables/useCollapsibleTree'
import RowDirectory from './RowDirectory.vue'
import SpecItem from './SpecItem.vue'
import type { FoundSpec } from '@packages/types/src'
import SelectSpecListView from './SelectSpecListView.vue'
import { includes } from 'lodash'

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

export type SpecViewType = 'flat' | 'tree'

const props = defineProps<{
  gql: Specs_SpecsListFragment
}>()

const showModal = ref(false)
const search = ref('')
const specViewType = ref<SpecViewType>('flat')

const updateTab = (tab: SpecViewType) => {
  specViewType.value = tab
}

const flatSpecList = computed(() => {
  if (search.value) {
    return props.gql.currentProject?.specs?.edges.filter((x) => x.node.absolute.toLowerCase().includes(search.value.toLowerCase()))
  }

  return props.gql.currentProject?.specs?.edges
})

const specTree = computed(() => buildSpecTree<FoundSpec & { gitInfo: SpecListRowFragment }>(props.gql.currentProject?.specs?.edges.map((x) => x.node) || []))
const collapsible = useCollapsibleTree(specTree.value, { dropRoot: true })

const treeSpecList = computed(() => {
  if (search.value) {
    // todo(lachlan) this will not show the folders of the filtered specs
    // we should update the useCollapsibleTree to have some kind of search
    // functionality, ideally with fuzzysort, that correctly returns the matched
    // specs and the directories to show.
    return collapsible.tree.filter(((item) => {
      return !item.hidden.value && item.data?.absolute.toLowerCase().includes(search.value.toLowerCase())
    }))
  }

  return collapsible.tree.filter(((item) => !item.hidden.value))
})
</script>
