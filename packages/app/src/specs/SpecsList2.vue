<script setup lang="ts">
import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import { useVirtualList } from '@vueuse/core'

const index: Ref = ref()
const search = ref('')

const allItems = Array.from(Array(99999).keys())
.map((i) => {
  return {
    height: 40,
    size: 'small',
  }
})

const filteredItems = computed(() => {
  return allItems.filter((i) => i.size.startsWith(search.value.toLowerCase()))
})

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
  filteredItems,
  {
    itemHeight: 40,
    overscan: 10,
  },
)
const handleScrollTo = () => {
  scrollTo(index.value)
}
</script>

<template>
  <div>
    <div>
      <div class="mr-4 inline-block">
        Jump to index
        <input
          v-model="index"
          placeholder="Index"
          type="number"
        >
      </div>
      <button
        type="button"
        @click="handleScrollTo"
      >
        Go
      </button>
    </div>
    <div>
      <div class="mr-4 inline-block">
        Filter list by size
        <input
          v-model="search"
          placeholder="e.g. small, medium, large"
          type="search"
        >
      </div>
    </div>
    <div
      v-bind="containerProps"
      class="rounded bg-gray-500/5 h-300px p-2 overflow-auto"
      style="height: 300px; padding: 0.25rem; overflow: auto; background: #eaeaea; border: solid black 1px; border-radius: 3px;"
    >
      <div v-bind="wrapperProps">
        <div
          v-for="{ index, data } in list"
          :key="index"
          class="border border-$c-divider mb-2"
          :style="{
            height: `40px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }"
        >
          Row {{ index }} <span
            opacity="70"
            m="l-1"
          >({{ data.size }})</span>
        </div>
      </div>
    </div>
  </div>
</template>
