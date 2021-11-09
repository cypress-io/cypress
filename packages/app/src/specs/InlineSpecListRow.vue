<template>
  <RouterLink
    :to="{ path: 'runner', query: { file: spec.relative } }"
    class="
      group
      focus:outline-none
      relative
      before:(absolute
      w-8px
      left-[-4px]
      h-28px
      border-r-4 border-r-gray-1000
      rounded-lg)
      before:hover:(transitional-all
      duration-250
      ease-in-out)
      before:hover:(border-r-indigo-300) before:focus:(border-r-indigo-300)
    "
    :class="{ 'before:border-r-indigo-300': selected }"
    @keydown.up.prevent="handleUp"
    @keydown.down.prevent="handleDown"
  >
    <div class="flex items-center pl-18px">
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

const relativeFolder = computed(() => {
  return props.spec.relative.replace(`/${props.spec.baseName}`, '')
})
const handleUp = (event) => {
  event.preventDefault()

  const target = event.target

  if (target.previousSibling.focus) {
    target.previousSibling.focus({ preventScroll: true })
    target.previousSibling.lastElementChild.scrollIntoView({
      block: 'nearest',
    })
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

<style scoped>
a::before {
  content: "";
}
</style>
