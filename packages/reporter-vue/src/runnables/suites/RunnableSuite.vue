<template>
  <BaseAccordion initially-open>
    <template #header>
      SUITE {{ suite.title }}
      State: {{ state }}
    </template>
    <slot></slot>
  </BaseAccordion>
</template>

<script lang="ts">
import { defineProps, defineComponent, computed } from 'vue'
import type { PropType } from 'vue'
import BaseAccordion from '../../components/BaseAccordion.vue'
import type {Suite} from '../types'

// defineProps({
//   suite: {
//     type: Object as PropType<Suite>
//   },
  
// })

export default {
  props: ['suite', 'state'],
  components: { BaseAccordion},
  setup(props) {
    return {
      state: computed(() => props.state),
      suite: computed(() => props.suite),
    }
  }
}
</script>
