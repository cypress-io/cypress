<template>
    <Popover class="relative">
        <PopoverButton>
            <slot name="heading">default</slot>
        </PopoverButton>
        <TransitionQuickFade>
            <PopoverPanel class="absolute right-0 z-10 bg-white w-240px shadow">
                <ul v-if="variant !== 'panel'" class="flex flex-col">
                    <slot></slot>
                </ul>
                <slot v-else></slot>
            </PopoverPanel>
        </TransitionQuickFade>
    </Popover>
</template>

<script setup lang="ts">
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
import TransitionQuickFade from '../transitions/TransitionQuickFade.vue';

const props = defineProps<{
  variant: String,
}>()


</script>