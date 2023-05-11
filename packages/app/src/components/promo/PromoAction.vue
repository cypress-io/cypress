<template>
  <div
    data-cy="promo-action"
    class="flex flex-row items-center gap-[12px] h-[32px] bg-gray-50 border border-gray-100 rounded w-fit text-sm"
  >
    <div class="rounded-l border-r-gray-100 flex flex-row ml-[12px] items-center justify-center h-full">
      <component
        :is="leftIcon"
        v-if="leftIcon"
        class="icon-dark-gray-500 icon-light-gray-200"
      />
      <span class="text-purple-500 whitespace-nowrap">
        {{ leftLabel }}
      </span>
    </div>

    <div class="bg-white h-full w-full">
      <Button
        data-cy="promo-action-control"
        variant="outline-light"
        size="32"
        class="border-none rounded-l-none py-[5px]"
        @click="action"
      >
        {{ rightLabel }}
        <component
          :is="rightIcon"
          v-if="rightIcon"
        />
      </Button>
    </div>
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
