<template>
  <!-- Recursively calls into itself to generate all of the suites -->
  <ul class="runnables">
    <li v-for="runnable in theRunnables" :key="runnable.id"> 
      <Suite :suite="runnable" v-if="runnable.type === 'suite'">
        <RunnablesList :runnables="runnable.children" />
      </Suite>
      <Test :test="runnable" v-if="runnable.type === 'test'">
      </Test>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import type { PropType } from 'vue'
import type { Suite as SuiteType, Test as TestType } from './types'
import Suite from './suites/RunnableSuite.vue'
import Test from './tests/RunnableTest.vue'
import { useRunnablesStore } from '../store'

export default defineComponent({
  components: {
    Suite,
    Test
  },
  name: 'runnables-list',
  props: {
    runnables: {
      type: Object as PropType<SuiteType | TestType>
    }
  },
  setup(props) {
    return { theRunnables: props.runnables }
    // return {
      // runnables: store.runnables,
    // }
  }
})

</script>

<style scoped lang="scss">
.runnables {
  padding: 0.25rem;
}
</style>