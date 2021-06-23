<template>
  <!-- todo, use ref to trigger open -->
  <BaseAccordion ref="accordion" :initially-open="false">
    <template #header>
    <div class="test-header">
      <div :class="classNames" v-show="test.state">
      {{ test.title }}
      State: {{ test.state }}
      </div>
      </div>
    </template>
    <slot>
    <div class="test-header">
      <Hook v-for="hook in test.hooks" :key="hook.id" :hook="hook"></Hook>
      <span v-show="test.state === 'failed'" v-for="log, idx in test.logs" :key="idx">{{ log }}</span>
      </div>
    </slot>
  </BaseAccordion>
  
</template>

<script lang="ts">


import { defineComponent, defineProps, computed, ref, watchEffect, } from 'vue'
import BaseAccordion from '../../components/BaseAccordion.vue'
import type { PropType } from 'vue'
import type { Test } from '../types'
import Hook from '../hooks/Hook.vue'

export default defineComponent({
  props: ['test'],
  components: {BaseAccordion, Hook},
  setup(props) {
    const accordion = ref(null)
    const test = computed(() => props.test)
    const state = computed(() => test.value.state)

    watchEffect(() => {
      if (state.value === 'failed') {
        accordion.value.show = true
      }
    })
    
    const color = computed(() => {
      const colors = {
        failed: 'red',
        passed: 'green',
        pending: 'gray',
        running: 'blue',
      }
      return colors[test.value.state]
    })

    const classNames = computed(() => ([
      'test',
      test.value.state,
      test.value.hasRetried ? 'retried' : ''
    ]))
    return {
      color,
      state,
      test,
      classNames,
      accordion
    }
  }
})

</script>

<style scoped lang="scss">


.test-header {
  position: relative;
  // padding-left: 0.5rem;
  padding-left: calc(0.5rem * v-bind(test.level));
  &:before {
    position: absolute;
    content: " ";
    width: 5px;
    height: 100%;
    left: 0;
    background: v-bind(color);
  }
}

.test {
  
  // &.pending {
  //   background: gray;
  // }
  // &.running {
  //   background: blue;
  // }
  // &.passed {
  //   background: green;
  // }
  // &.failed {
  //   background: red;
  // }
}
</style>
