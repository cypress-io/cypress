<script setup lang="ts">
import { useSlots } from 'vue'

withDefaults(defineProps<{
  disabled: boolean
}>(), {
  disabled: false,
})

const slots = useSlots()
const emit = defineEmits(['toggle'])
</script>

<template>
  <div
    class="block w-full mb-4 overflow-hidden border border-gray-100 rounded bg-light-50"
    :class="disabled ? undefined : 'hocus-default'"
    :tabindex="disabled ? undefined : 0"
    @click="emit('toggle')"
    @keypress.space.prevent="emit('toggle')"
  >
    <div
      class="flex items-center w-full text-left rounded py-14px"
      :class="disabled ? 'cursor-pointer' : undefined"
    >
      <div class="flex items-center h-40px px-24px border-r border-r-gray-100">
        <slot name="icon" />
      </div>
      <div class="flex-grow px-16px">
        <p class="text-indigo-500 whitespace-nowrap h-24px">
          <slot name="header" />
        </p>
        <p class="text-sm font-light text-gray-500 h-20px">
          <slot name="description" />
        </p>
      </div>
      <div
        v-if="slots.right"
        class="flex items-center px-16px"
      >
        <slot name="right" />
      </div>
    </div>
    <div
      v-if="slots.slider"
      @click.stop=""
    >
      <slot name="slider" />
    </div>
  </div>
</template>
