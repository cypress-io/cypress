<template>
  <Popover
    class="relative bg-white"
    #="{ open, close }"
  >
    <PopoverButton
      class="flex-grow h-full group focus:outline-none focus:ring-0"
      @click="emit('clearForceOpen')"
    >
      <div
        class="flex items-center text-gray-600 gap-8px group-hocus:text-indigo-600"
        :class="(open || forceOpenState) ? 'text-indigo-600' : ''"
      >
        <slot
          name="heading"
          :open="open"
          :close="close"
        />
        <i-cy-chevron-down
          class="transition-all duration-300 transform w-10px group-hocus:icon-dark-indigo-500"
          :class="(open || forceOpenState) ? 'rotate-180 icon-dark-indigo-500' : 'icon-dark-gray-200'"
        />
      </div>
    </PopoverButton>
    <TransitionQuickFade>
      <PopoverPanel
        static
        class="absolute right-0 z-10 bg-white rounded shadow top-36px"
        :class="(forceOpenState === true) || open ? '' : 'hidden'"
      >
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
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'

defineProps<{
  variant?: string,
  forceOpenState?: boolean
}>()

const emit = defineEmits<{
  (e: 'clearForceOpen'): void,
}>()

</script>
