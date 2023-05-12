<template>
  <div class="flex flex-col bg-gray-50 border-gray-100 py-[16px] px-[24px] rounded-t-[8px] gap-16px items-start w-full">
    <div class="flex flex-col xl:flex-row w-full items-start xl:items-center gap-[16px]">
      <div class="flex flex-col flex-grow justify-center">
        <div
          data-cy="promo-header-title"
          class="font-md font-medium"
        >
          {{ title }}
        </div>
        <div
          v-if="slots.description"
          data-cy="promo-header-description"
          class="text-sm font-normal"
        >
          <slot name="description" />
        </div>
      </div>
      <div
        v-if="slots.control"
      >
        <slot name="control" />
      </div>
    </div>
    <div
      v-if="slots.content"
      class="pt-[24px] w-full"
    >
      <slot name="content" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useSlots } from 'vue'

const slots = useSlots()

withDefaults(defineProps<{
  title: string
}>(), {})

</script>
