<template>
  <RouterLink
    :to="{ path: 'runner', query: { file: spec.relative } }"
    class="group spec-item focus:outline-none relative"
    @keydown.up.prevent="handleUp"
    @keydown.down.prevent="handleDown"
  >
    <div
      class="group flex items-center pl-18px"
      :class="{ 'selected': selected }"
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
  event.preventDefault()

  const target = event.target

  if (target.previousSibling.focus) {
    target.previousSibling.focus({ preventScroll: true })
    target.previousSibling.lastElementChild.scrollIntoView({ block: 'nearest' })
  } else {
    if (!target.parentElement.lastElementChild) return

    target.parentElement.lastElementChild.focus({ preventScroll: true })
    target.parentElement.lastElementChild.scrollIntoView(false)
  }
}

const handleDown = (event) => {
  event.preventDefault()

  const target = event.target

  if (target.nextSibling.focus) {
    target.nextSibling.focus({ preventScroll: true })
    target.nextSibling.scrollIntoView({ block: 'nearest' })
  } else {
    if (!target.parentElement.firstElementChild) return

    target.parentElement.firstElementChild.focus({ preventScroll: true })
    target.parentElement.firstElementChild.scrollIntoView(false)
  }
}
</script>

<style>
.spec-item::before,
.selected::before {
  @apply absolute content-[""] w-8px left-[-4px] h-28px border-r-4 border-gray-1000;
}

.spec-item:hover::before {
  transition: all ease-in-out 0.3s;
}

.spec-item:hover::before,
.spec-item:focus::before,
.selected::before {
  @apply border-r-indigo-300 rounded-lg;
}
</style>
