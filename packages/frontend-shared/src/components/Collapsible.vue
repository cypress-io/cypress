<template>
  <div
    :tabindex="disable ? '-1' : '0'"
    data-cy="collapsible"
    @keypress.space.enter.self.prevent="!disable && toggle()"
  >
    <div
      data-cy="collapsible-header"
      role="button"
      :aria-expanded="isOpen"
      class="rounded-t focus:outline-indigo-500"
      :class="{'rounded-b': !isOpen}"
      @click="!disable && toggle()"
      @keypress.space.enter.self="!disable && toggle()"
    >
      <slot
        name="target"
        :open="isOpen"
        :toggle="toggle"
      />
    </div>
    <div
      :style="{
        maxHeight: isOpen ? maxHeight : '0px',
      }"
      :aria-hidden="!isOpen"
      :class="{
        'overflow-auto': isOpen && overflow,
        'border rounded rounded-t-none bg-light-50 border-gray-100 mb-4 w-full block': isOpen && fileRow,
        'overflow-hidden': !isOpen && fileRow
      }"
    >
      <slot
        v-if="!lazy || lazy && isOpen"
        :toggle="toggle"
        :open="isOpen"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import { watch } from 'vue'

const props = withDefaults(defineProps<{
  maxHeight?: string
  initiallyOpen?: boolean
  lazy?: boolean
  disable?: boolean
  overflow?: boolean
  fileRow?: boolean
}>(), {
  initiallyOpen: false,
  maxHeight: '500px',
  lazy: false,
  disable: false,
  overflow: true,
  fileRow: false,
})

const [isOpen, toggle] = useToggle(props.initiallyOpen)

watch(() => props.initiallyOpen, (val, oldVal) => {
  // It was toggled from false to true by the parent to
  // force the collapsible to open.
  if (oldVal === false && val === true) {
    isOpen.value = true
  }
})
</script>
