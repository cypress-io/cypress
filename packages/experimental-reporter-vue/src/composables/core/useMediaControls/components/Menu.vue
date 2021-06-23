<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside, useEventListener } from '@vueuse/core'

const menu = ref()
const isOpen = ref()

onClickOutside(menu, () => isOpen.value = false)
useEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isOpen)
    isOpen.value = false
})

const open = () => isOpen.value = true
const close = () => isOpen.value = false
</script>

<template>
  <div class="relative">
    <slot :open="open" />
    <div ref="menu" :class="{ 'pointer-events-none opacity-0': !isOpen }">
      <slot name="menu" :isOpen="isOpen" :close="close" />
    </div>
  </div>
</template>
