<template>
  <!-- todo, use ref to trigger open -->
  <BaseAccordion ref="accordion" :initially-open="false">
    <template #header>
      <div :class="classNames" v-show="test.state">
      {{ test.title }}
      State: {{ test.state }}
      </div>
    </template>
    <slot>
      <!-- <template></template> -->
      <Hook v-for="hook in test.hooks" :key="hook.id" :hook="hook"></Hook>
      <span v-show="test.state === 'failed'" v-for="log, idx in test.logs" :key="idx">{{ log }}</span>
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

    const classNames = computed(() => ([
      'test',
      test.value.state,
      test.value.hasRetried ? 'retried' : ''
    ]))
    return {
      state,
      test,
      classNames,
      accordion
    }
  }
})

</script>

<style scoped lang="scss">
.test {
  &.pending {
    background: gray;
  }
  &.running {
    background: blue;
  }
  &.passed {
    background: green;
  }
  &.failed {
    background: red;
  }
}
</style>
