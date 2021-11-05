<template>
  <RouterLink
    :to="{ path: 'runner', query: { file: spec.relative } }"
    class="group spec-item focus:outline-none"
    @keydown.up="handleUp"
    @keydown.down="handleDown"
  >
    <div
      class="group flex items-center pl-18px"
      :class="{ selected: selected }"
    >
      <SpecFileItem
        :file-name="spec.fileName"
        :extension="spec.specFileExtension"
        :selected="selected"
      />
      <span
        class="
          font-light
          text-sm text-gray-700
          pl-8px
          hidden
          group-hover:inline
        "
      >{{ relativeFolder }}</span>
    </div>
  </RouterLink>
</template>

<script lang="ts" setup>
import type { FoundSpec } from '@packages/types'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SpecFileItem from './SpecFileItem.vue'

const props = defineProps<{
  spec: FoundSpec;
  selected: boolean;
}>()

const relativeFolder = computed(() => props.spec.relative.replace(`/${props.spec.baseName}`, ''))
const handleUp = (event) => {
  const target = event.target

  if (!target.previousSibling.focus) {
    target.parentElement.lastElementChild.focus()
  } else {
    target.previousSibling.focus()
  }
}

const handleDown = (event) => {
  const target = event.target

  if (!target.nextSibling.focus) {
    target.parentElement.firstElementChild.focus()
  } else {
    target.nextSibling.focus()
  }
}
</script>

<style>
.spec-item:hover::before,
.spec-item:focus::before,
.selected::before {
  position: absolute;
  content: "";
  width: 8px;
  left: -4px;
  height: 28px;
  @apply border-r-4 border-r-indigo-300 rounded-lg;
}
</style>
