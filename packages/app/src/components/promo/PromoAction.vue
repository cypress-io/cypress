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
      <ExternalLink
        v-if="href"
        data-cy="promo-action-link"
        :href="href"
        class="rounded-r bg-white items-center flex flex-row text-indigo-500 h-full"
      >
        <span
          class="flex flex-row items-center font-medium mx-[12px] whitespace-nowrap"
        >
          {{ rightLabel }}
          <component
            :is="rightIcon"
            v-if="rightIcon"
            class="ml-[8px]"
          />
        </span>
      </ExternalLink>
      <Button
        v-else
        data-cy="promo-action-control"
        variant="outline-light"
        size="32"
        class="border-none rounded-l-none py-[5px]"
        @click="action"
      >
        {{ rightLabel }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Component } from 'vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import Button from '@cypress-design/vue-button'

interface PromoActionType {
  action?: () => void
  href?: string
  leftIcon?: Component
  leftLabel?: string
  rightLabel?: string
  rightIcon?: Component
}

defineProps<PromoActionType>()

</script>
