<template>
  <div
    class="rounded flex text-left w-full py-[14px] items-center"
  >
    <div class="flex h-[40px] px-[24px] items-center">
      <slot name="icon">
        <component
          :is="icon"
          class="h-[24px] w-[24px]"
        />
      </slot>
    </div>
    <div class="flex flex-row grow flex-wrap h-auto border-gray-100 border-l-[1px] px-[16px] gap-[4px] justify-between">
      <div>
        <h2
          class="text-indigo-500 whitespace-nowrap"
          :class="{'text-[18px] leading-[24px]': bigHeader}"
        >
          <slot name="header" />
        </h2>
        <p class="font-normal text-sm text-gray-700 select-none">
          <slot name="description">
            <span>{{ description }}</span>
          </slot>
        </p>
      </div>
      <div
        v-if="slots.middle"
        class="flex items-center"
      >
        <slot name="middle" />
      </div>
    </div>

    <div
      v-if="slots.right"
      class="flex px-[16px] items-center"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { useSlots } from 'vue'

withDefaults(defineProps<{
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
</script>
