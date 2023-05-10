<template>
  <component
    :is="wrapperComponent"
    data-cy="promo-action"
    class="flex flex-row items-center gap-[12px] h-[32px] bg-gray-50 border border-gray-100 rounded w-fit text-sm"
    :class="wrapperClasses"
    v-bind="wrapperProps"
    @click="action"
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

    <div
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
    </div>
  </component>
</template>

<script lang="ts" setup>
import type { Component } from 'vue'
import { computed } from 'vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'

interface PromoActionType {
  action?: () => void
  href?: string
  leftIcon?: Component
  leftLabel?: string
  rightLabel?: string
  rightIcon?: Component
}

const props = defineProps<PromoActionType>()

const wrapperComponent = computed(() => {
  if (props.href) {
    return ExternalLink
  }

  return 'div'
})

const wrapperClasses = computed(() => {
  if (props.action) {
    return 'hocus-default cursor-pointer'
  }

  return ''
})

const wrapperProps = computed(() => {
  if (props.href) {
    return {
      href: props.href,
    }
  }

  return {}
})

</script>
