<template>
  <BaseAccordion initially-open>
    <template #header>
      {{ suite.title }}
      State: {{ suite.state }}
    </template>
    <slot></slot>
  </BaseAccordion>
</template>

<script lang="ts" setup>
import { defineProps, ref } from 'vue'
import type { PropType } from 'vue'
import BaseAccordion from '../../components/BaseAccordion.vue'
import type {Suite} from '../types'

defineProps({
  suite: {
    type: Object as PropType<Suite>
  }
})
</script>