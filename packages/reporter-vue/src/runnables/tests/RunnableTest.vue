<template>
  <div :class="classNames">
    {{ props.test.title }}
    {{ props.test.state }}
    Parent: {{ props.test.parentId }}
    <!-- {{props.test.title}} -->
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref } from 'vue'
import type { PropType } from 'vue'
import type { Test } from '../types'

const props = defineProps({
  test: {
    type: Object as PropType<Test>
  }
})

const classNames = computed(() => ([
  'test',
  props.test.state,
  props.test.hasRetried ? 'retried' : ''
]))
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