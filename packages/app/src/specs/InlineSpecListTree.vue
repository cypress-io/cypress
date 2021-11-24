<template>
  <div
    v-bind="containerProps"
    class="specs-list-container"
  >
    <ul
      v-bind="wrapperProps"
      class="children:h-28px"
      tabindex="0"
    >
      <li
        v-for="row in list"
        :key="row.index"
        :ref="el => setItemRef(el, row.index)"
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
        :style="{ paddingLeft: `${(row.data.depth - 2) * 10 + 16}px` }"
        :class="{'before:hover:(transitional-all duration-250 ease-in-out border-r-indigo-300) before:focus:(border-r-indigo-300)': row.data.isLeaf, 'before:border-r-indigo-300': isCurrentSpec(row.data)}"
        data-testid="spec-row-item"
        @click="onRowClick(row.data, row.index)"
        @keypress.enter.space.prevent="onRowClick(row.data, row.index)"
      >
        <SpecFileItem
          v-if="row.data.isLeaf"
          :file-name="row.data.data?.fileName || row.data.name"
          :extension="row.data.data?.specFileExtension || ''"
          :selected="isCurrentSpec(row.data)"
          :indexes="getIndexes(row.data)"
          class="pl-22px"
          data-testid="spec-file-item"
        />
        <DirectoryItem
          v-else
          :name="row.data.name"
          :expanded="treeSpecList[row.index].expanded.value"
          :indexes="getIndexes(row.data)"
          data-testid="directory-item"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useCollapsibleTree, UseCollapsibleTreeNode } from '@packages/frontend-shared/src/composables/useCollapsibleTree'
import { buildSpecTree, FuzzyFoundSpec, SpecTreeNode, getIndexes } from '@packages/frontend-shared/src/utils/spec-utils'
import SpecFileItem from './SpecFileItem.vue'
import { computed, watch } from 'vue'
import DirectoryItem from './DirectoryItem.vue'
import { useRouter } from 'vue-router'
import { useSpecStore } from '../store'
import { useVirtualList } from '@packages/frontend-shared/src/composables/useVirtualList'
import { useVirtualListNavigation } from '@packages/frontend-shared/src/composables/useVirtualListNavigation'

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

const collapsible = computed(() => useCollapsibleTree(buildSpecTree<FuzzyFoundSpec>(props.specs), { dropRoot: true }))
const treeSpecList = computed(() => collapsible.value.tree.filter(((item) => !item.hidden.value)))

const onRowClick = (row: UseCollapsibleTreeNode<SpecTreeNode<FuzzyFoundSpec>>, idx: number) => {
  activeItem.value = idx
  if (row.isLeaf) {
    if (!row.data) {
      return
    }

    router.push({ path: 'runner', query: { file: row.data.relative } })
  } else {
    row.toggle()
  }
}

const { containerProps, list, wrapperProps, scrollTo, api } = useVirtualList(treeSpecList, { itemHeight: 28, overscan: 15 })
const { activeItem, rowProps, setItemRef } = useVirtualListNavigation(api)

// If you are scrolled down the virtual list and list changes,
// reset scroll position to top of list
watch(collapsible, () => {
  activeItem.value = null
  scrollTo(0)
})

</script>

<style scoped>
li::before {
  content: "";
}

/** h-[calc] was getting dropped so moved to styles. Virtual list requires defined height */

/** Header is 80px */
.specs-list-container {
  height: calc(100vh - 80px)
}
</style>
