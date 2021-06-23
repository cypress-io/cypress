<script setup lang="ts">
import { stringify } from '@vueuse/docs-utils'
import { useToggle } from '../../shared'
import { ref, computed, reactive } from 'vue'
import { useMousePressed } from '.'

const el = ref<Element | null>(null)
const [withTarget, toggle] = useToggle()
const target = computed<Element | null>(() => {
  if (withTarget.value)
    return el.value
  return window as any as Element
})

const mouse = reactive(useMousePressed({ target }))
const text = stringify(mouse)
</script>

<template>
  <div ref="el" class="select-none">
    <pre lang="yaml">{{ text }}</pre>
    <div>
      Tracking on
      <button class="ml-2 button small" @click="toggle">
        {{ withTarget ? 'Demo section' : 'Entire page' }}
      </button>
    </div>
  </div>
</template>
