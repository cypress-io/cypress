<template>
  <!-- Recursively calls into itself to generate all of the runnables -->
  <ul class="runnables">
    <li v-for="runnable in runnables" :key="runnable.id"> 
      <Suite :suite="runnable" v-if="runnable.type === 'suite'">
        <RunnablesList :runnables="runnable.children" />
      </Suite>
      <Test v-if="runnable.type === 'test'" :test="runnable"  />
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import type { PropType } from 'vue'
import type { Suite as SuiteType, Test as TestType } from './types'
import Suite from './suites/RunnableSuite.vue'
import Test from './tests/RunnableTest.vue'

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
    return { runnables: computed(() => props.runnables || {}) }
  }
})

</script>

<style scoped lang="scss">
.runnables {
  padding: 0.25rem;
}
</style>