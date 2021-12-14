<template>
  <div
    class="rounded flex text-left w-full py-14px items-center"
  >
    <div class="flex h-40px px-24px items-center">
      <slot name="icon">
        <component
          :is="icon"
          class="h-24px w-24px"
        />
      </slot>
    </div>
    <div class="bg-gray-100 h-40px w-1px" />
    <div class="flex-grow h-auto px-16px">
      <h2
        class="text-indigo-500 whitespace-nowrap"
        :class="{'text-size-18px leading-24px': bigHeader}"
      >
        <slot name="header" />
      </h2>
      <p class="font-normal text-sm text-gray-600 select-none">
        <slot name="description">
          <span>{{ description }}</span>
        </slot>
      </p>
    </div>
    <div
      v-if="slots.right"
      class="flex px-16px items-center"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FunctionalComponent, SVGAttributes, useSlots } from 'vue'

const props = withDefaults(defineProps<{
  description?: string
  icon?: FunctionalComponent<SVGAttributes>
  gray?: boolean
  bigHeader?: boolean
}>(), {
  description: undefined,
  icon: undefined,
  gray: false,
  bigHeader: false,
})

const slots = useSlots()

const gray = true
</script>
