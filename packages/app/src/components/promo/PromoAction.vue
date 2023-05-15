<template>
  <div
    data-cy="promo-action"
    class="flex flex-row items-center rounded"
  >
    <div class="text-sm rounded-l bg-gray-50 border border-r-0 border-gray-100 flex flex-row px-[12px] py-[6px] items-center justify-center h-full">
      <component
        :is="leftIcon"
        v-if="leftIcon"
        class="icon-dark-gray-500 icon-light-gray-200 my-[2px]"
      />
      <span class="text-purple-500 whitespace-nowrap">
        {{ leftLabel }}
      </span>
    </div>

    <Button
      data-cy="promo-action-control"
      variant="outline-light"
      size="32"
      class="rounded-l-none"
      @click="action"
    >
      {{ rightLabel }}
      <component
        :is="rightIcon"
        v-if="rightIcon"
      />
    </Button>
  </div>
</template>

<script lang="ts" setup>
import type { Component } from 'vue'
import Button from '@cypress-design/vue-button'

interface PromoActionType {
  action?: () => void
  leftIcon?: Component
  leftLabel?: string
  rightLabel?: string
  rightIcon?: Component
}

defineProps<PromoActionType>()

</script>
