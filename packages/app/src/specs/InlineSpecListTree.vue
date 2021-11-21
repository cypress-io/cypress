<template>
  <ul
    ref="rootEl"
    tabindex="0"
  >
    <li
      v-for="(row, idx) in filteredTree"
      :key="idx"
      v-bind="rowProps"
      class="
        flex
        outline-none
        group
        cursor-pointer
        relative
        before:(absolute
        w-8px
        left-[-4px]
        h-28px
        border-r-4 border-r-gray-1000
        rounded-lg)
        item
      "
      :style="{ paddingLeft: `${(row.depth - 2) * 10 + 16}px` }"
      :class="{'before:hover:(transitional-all duration-250 ease-in-out border-r-indigo-300) before:focus:(border-r-indigo-300)': row.isLeaf, 'before:border-r-indigo-300': isCurrentSpec(row)}"
      @click="onRowClick(row, idx)"
      @keypress.enter.space.prevent="onRowClick(row, idx)"
    >
      <SpecFileItem
        v-if="row.isLeaf"
        :file-name="row.data?.fileName || row.name"
        :extension="row.data?.specFileExtension || ''"
        :selected="isCurrentSpec(row)"
        :indexes="getIndexes(row)"
        class="pl-22px"
      />
      <DirectoryItem
        v-else
        :name="row.name"
        :expanded="row.expanded.value"
        :indexes="getIndexes(row)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useCollapsibleTree, UseCollapsibleTreeNode } from '@packages/frontend-shared/src/composables/useCollapsibleTree'
import { useListNavigation } from '@packages/frontend-shared/src/composables/useListNavigation'
import { buildSpecTree, FuzzyFoundSpec, SpecTreeNode, getIndexes } from '@packages/frontend-shared/src/utils/spec-utils'
import SpecFileItem from './SpecFileItem.vue'
import { computed, ref, Ref } from 'vue'
import DirectoryItem from './DirectoryItem.vue'
import { useRouter } from 'vue-router'
import { useSpecStore } from '../store'

const props = defineProps<{
  specs: FuzzyFoundSpec[]
}>()

const router = useRouter()

const specStore = useSpecStore()

const isCurrentSpec = (row: UseCollapsibleTreeNode<SpecTreeNode<FuzzyFoundSpec>>) => {
  if (!row.isLeaf || !row.data) {
    return false
  }

  return row.data.relative === specStore.activeSpec?.relative
}

const specTree = computed(() => buildSpecTree<FuzzyFoundSpec>(props.specs))
const collapsible = computed(() => useCollapsibleTree(specTree.value, { dropRoot: true }))
const filteredTree = computed(() => collapsible.value.tree.filter(((item) => !item.hidden.value)))

const onRowClick = (row: UseCollapsibleTreeNode<SpecTreeNode<FuzzyFoundSpec>>, idx) => {
  selectedItem.value = idx
  if (row.isLeaf) {
    if (!row.data) {
      return
    }

    router.push({ path: 'runner', query: { file: row.data.relative } })
  } else {
    row.toggle()
  }
}

const rootEl = ref<HTMLUListElement>()

const { selectedItem, rowProps } = useListNavigation(rootEl)
</script>

<style scoped>
li::before {
  content: "";
}
</style>
