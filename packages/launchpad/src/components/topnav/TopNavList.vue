<template>
  <Popover
    class="relative bg-white"
    #="{ open }"
  >
    <PopoverButton class="flex-grow h-full group focus:outline-none focus:ring-0">
      <div
        class="flex items-center gap-2 group-hocus:text-indigo-600"
        :class="open ? 'text-indigo-600' : ''"
      >
        <slot
          name="heading"
          :open="open"
        >
          default
        </slot>
        <i-cy-chevron-down
          class="w-2.5 transform group-hocus:icon-dark-indigo-500"
          :class="open ? 'rotate-180 icon-dark-indigo-500' : 'icon-dark-gray-100'"
        />
      </div>
    </PopoverButton>
    <TransitionQuickFade>
      <PopoverPanel class="absolute right-0 z-10 bg-white rounded shadow">
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
