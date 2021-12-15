<template>
  <div
    v-bind="containerProps"
    class="pt-8px specs-list-container overscroll-contain overflow-y-auto"
  >
    <ul
      v-bind="wrapperProps"
      class="children:h-30px"
    >
      <li
        v-for="row in list"
        :key="row.index"
        class="
        border-transparent cursor-pointer
        flex
        border-1
        relative
        group
        hover:border-gray-900
        focus-within:border-indigo-300
        hover:focus-within:border-indigo-300"
        :class="{
          'hover:border-gray-1000': isCurrentSpec(row.data),
        }"
        data-testid="spec-row-item"
        @click.self="submit(row.data, row.index)"
      >
        <RouterLink
          :ref="el => setItemRef(el, row.index)"
          :key="row.data.data?.absolute"
          :tabindex="isTabbable(row, row.index) ? '0' : '-1'"
          :style="{ paddingLeft: `${(row.data.depth - 2) * 10 + 16}px` }"
          class="outline-none w-full group before:(border-r-4 h-27px rounded-r-4px absolute left-[-4px] w-8px) "
          :class="{'before:border-r-indigo-300 before:border-r-4': isCurrentSpec(row.data),
                   'group-hocus:bg-gray-900 focus:bg-gray-900 before:focus-within:(border-r-0) before:(border-r-gray-1000) before:group-hover:(h-26px border-r-gray-900)': !isCurrentSpec(row.data)
          }"
          :to="{ path: '/specs/runner', query: { file: row.data.data?.relative } }"
          @focus="resetFocusIfNecessary(row, row.index)"
          @click.capture.prevent="submit(row.data, row.index)"
          @keydown.enter.space.prevent.stop="submit(row.data, row.index)"
          @keydown.left.right.prevent.stop="toggle(row.data, row.index)"
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
            class="children:truncate"
            :name="row.data.name"
            :expanded="treeSpecList[row.index].expanded.value"
            :indexes="getIndexes(row.data)"
            data-testid="directory-item"
          />
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useCollapsibleTree, UseCollapsibleTreeNode } from '@packages/frontend-shared/src/composables/useCollapsibleTree'
import { buildSpecTree, FuzzyFoundSpec, SpecTreeNode, getIndexes } from '@packages/frontend-shared/src/utils/spec-utils'
import SpecFileItem from './SpecFileItem.vue'
import { computed, watch, onMounted, onUpdated } from 'vue'
import DirectoryItem from './DirectoryItem.vue'
import { RouterLink, useRouter } from 'vue-router'
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

const findCurrentSpecIndex = computed(() => {
  return treeSpecList.value.findIndex((s) => isCurrentSpec(s))
})

const hasAnyCurrentSpec = computed(() => {
  return findCurrentSpecIndex.value > -1
})

const isTabbable = (row, index) => {
  if (!hasAnyCurrentSpec.value) {
    if (index === 0) return true
  } else if (isCurrentSpec(row.data)) {
    return true
  }

  return false
}

const toggle = (row: UseCollapsibleTreeNode<SpecTreeNode<FuzzyFoundSpec>>, idx: number) => {
  activeItem.value = idx
  row.toggle()
}

const submit = (row: UseCollapsibleTreeNode<SpecTreeNode<FuzzyFoundSpec>>, idx: number) => {
  activeItem.value = idx

  if (row.isLeaf) {
    if (!row.data) {
      return
    }

    router.push({ path: '/specs/runner', query: { file: row.data.relative } })
  } else {
    row.toggle()
  }

  return false
}

const { containerProps, list, wrapperProps, scrollTo, api } = useVirtualList(treeSpecList, { itemHeight: 30, overscan: 15 })
const { activeItem, setItemRef } = useVirtualListNavigation(api)

onMounted(() => {
  activeItem.value = findCurrentSpecIndex.value
})

// If you are scrolled down the virtual list and list changes,
// reset scroll position to top of list
watch(collapsible, () => {
  activeItem.value = null
  scrollTo(0)
})

const resetFocusIfNecessary = (row, index) => {
  if (isTabbable(row, index)) {
    activeItem.value = index
  }
}

</script>

<style scoped>
a::before {
  content: "";
}

/** h-[calc] was getting dropped so moved to styles. Virtual list requires defined height. */
/** Header is 64px, padding-bottom is 8px **/
.specs-list-container {
  height: calc(100vh - 64px - 8px);
}

</style>
