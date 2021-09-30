<template>
  <Popover
    class="relative bg-white"
    #="{ open }"
  >
    <PopoverButton class="group flex-grow h-full focus:outline-none focus:ring-0">
      <slot
        name="heading"
        :open="open"
      >
        default
      </slot>
    </PopoverButton>
    <TransitionQuickFade>
      <PopoverPanel class="absolute right-0 z-10 bg-white shadow rounded">
        <ul
          v-if="variant !== 'panel'"
          class="flex flex-col"
        >
          <slot />
        </ul>
        <slot v-else />
      </PopoverPanel>
    </TransitionQuickFade>
  </Popover>
</template>

<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import TransitionQuickFade from '../transitions/TransitionQuickFade.vue'

const props = defineProps<{
  variant?: String,
}>()

</script>
