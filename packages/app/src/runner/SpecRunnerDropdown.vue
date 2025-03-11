<template>
  <Popover
    :key="`${props.disabled}`"
    class="rounded-[50px] h-[30px] mx-[6px] py-[2px] relative"
    #="{ open, close }"
  >
    <PopoverButton
      class="bg-white border rounded-[50px] self-center h-full grow px-[5px] group"
      :class="{
        'hocus-default': !props.disabled,
        'opacity-50 cursor-auto': props.disabled,
        'rounded-[5px] border-[1px] border-indigo-100': !props.minimal,
        'border-transparent': props.minimal,
      }"
      :disabled="props.disabled"
    >
      <div
        class="flex gap-[8px] items-center"
        :class="{
          'group-hocus:text-indigo-600': !props.disabled,
          'text-indigo-600': open,
          'text-gray-600': !open,
        }"
      >
        <slot
          name="heading"
          :open="open"
          :close="close"
        />
        <i-cy-chevron-down
          v-if="!props.minimal"
          class="transform transition-all w-[10px] duration-300"
          :class="{
            'group-hocus:icon-dark-indigo-500': !props.disabled,
            'icon-dark-gray-200': !open,
            'rotate-180 icon-dark-indigo-500': open,
          }"
        />
      </div>
    </PopoverButton>
    <TransitionQuickFade>
      <PopoverPanel
        static
        class="bg-white rounded shadow-dropdown top-[36px] z-10 absolute"
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
  minimal?: boolean
  // The disabled prop is used as the Popover key so that changes to the prop
  // cause the Popover component to mount again. This re-mounting ensures that
  // the PopoverPanel is closed if an enabled dropdown later becomes disabled.
  disabled?: boolean
}>(), {
  minimal: true,
  variant: undefined,
  align: 'left',
  disabled: false,
})

</script>
