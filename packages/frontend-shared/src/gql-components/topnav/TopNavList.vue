<template>
  <Popover
    class="bg-white relative"
    #="{ open, close }"
  >
    <PopoverButton
      class="grow h-full group focus:outline-none focus:ring-0"
      @click="emit('clearForceOpen')"
    >
      <div
        class="flex gap-[8px] items-center group-hocus:text-indigo-600"
        :class="(open || props.forceOpenState) ? 'text-indigo-600' : 'text-gray-600'"
      >
        <slot
          name="heading"
          :open="open"
          :close="close"
        />
        <i-cy-chevron-down
          class="transform transition-all w-[10px] duration-300 group-hocus:icon-dark-indigo-500"
          :class="(open || props.forceOpenState) ? 'rotate-180 icon-dark-indigo-500' : 'icon-dark-gray-200'"
        />
      </div>
    </PopoverButton>
    <TransitionQuickFade>
      <!-- instead of using 'hidden' class, we use 'invisible' due to -->
      <!-- https://github.com/cypress-io/cypress-design/issues/517 -->
      <PopoverPanel
        static
        class="bg-white rounded shadow-dropdown top-[36px] right-0 z-10 absolute"
        :class="(forceOpenState === true) || open ? '' : 'invisible'"
      >
        <ul
          v-if="variant !== 'panel'"
          class="flex flex-col max-h-[50vh] overflow-auto"
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

const props = defineProps<{
  variant?: string
  forceOpenState?: boolean
}>()

const emit = defineEmits<{
  (e: 'clearForceOpen'): void
}>()

</script>
