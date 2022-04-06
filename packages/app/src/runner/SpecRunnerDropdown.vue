<template>
  <Popover
    class="bg-white rounded border-1px border-gray-100 h-32px relative"
    #="{ open, close }"
  >
    <PopoverButton
      class="border-transparent rounded flex-grow h-full border-1px px-12px group hocus-default"
    >
      <div
        class="flex text-gray-600 gap-8px items-center group-hocus:text-indigo-600"
        :class="open ? 'text-indigo-600' : ''"
      >
        <slot
          name="heading"
          :open="open"
          :close="close"
        />
        <i-cy-chevron-down
          class="transform transition-all w-10px duration-300 group-hocus:icon-dark-indigo-500"
          :class="open ? 'rotate-180 icon-dark-indigo-500' : 'icon-dark-gray-200'"
        />
      </div>
    </PopoverButton>
    <TransitionQuickFade>
      <PopoverPanel
        static
        class="bg-white rounded shadow top-36px z-10 absolute"
        :class="{'hidden': !open, 'right-0': align === 'right', 'left-0': align === 'left'}"
      >
        <ul
          v-if="props.variant !== 'panel'"
          class="flex flex-col"
        >
          <slot />
        </ul>
        <slot v-else />
      </PopoverPanel>
    </TransitionQuickFade>
  </Popover>
</template>

<script lang="ts" setup>
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

const props = withDefaults(defineProps<{
  variant?: 'panel'
  align?: 'left' | 'right'
}>(), {
  variant: undefined,
  align: 'right',
})
</script>
