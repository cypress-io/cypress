<template>
  <BaseAccordion initially-open>
    <template #header>
      <span v-if="state === 'not-started'"></span>
      <template v-else>
        Suite Name: {{ suite.title }}
        <b>My state</b>: {{ state }}
      <hr/>
      </template>
    </template>
    <slot></slot>
  </BaseAccordion>
</template>

<script lang="ts">
import { computed } from 'vue'
import BaseAccordion from '../../components/BaseAccordion.vue'
import _ from 'lodash'

function collectStateRecusively(node, state) {
  const children = node.type === 'test' ? [] : node.children
  if (node.children && !node.children.length) return state

  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.type === 'test') {
      state[child.state || 'not-started'] = state[child.state || 'not-started'] || 0
      state[child.state || 'not-started']++
    }

    collectStateRecusively(child, state)
  }
  if (node.type === 'test') return state
}
export default {
  props: ['suite', 'state'],
  components: { BaseAccordion},
  setup(props) {
    const sumOfStates = computed(() => {
      const state = {}
      collectStateRecusively(props.suite, state)
      return state
    })
    
    const state = computed(() => {
        if (sumOfStates.value.failed) return 'failed'
        if (sumOfStates.value.running) return 'running'
        if (sumOfStates.value['not-started']) return 'not-started'
        if (sumOfStates.value.pending && !sumOfStates.value.passed) return 'pending'
        return 'passed'
    })

    return {
      sumOfStates,
      state,
      suite: computed(() => props.suite),
    }
  }
}
</script>
