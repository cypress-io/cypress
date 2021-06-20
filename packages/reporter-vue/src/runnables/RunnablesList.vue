<template>
  <div>Runnables List</div>
  <!-- {{ root }} -->
  <Suspense>
    <template #fallback>
      Loading
    </template>

    <!-- {{ runnablesStore.rootRunnable }} -->
    <ul class="runnables">
    <!-- {{ runnablesStore.runnables }} -->
      <li v-for="runnable in runnablesStore.runnables" :key="runnable.id">
        <!-- {{ runnable.title }} -->
        <!-- <BaseAccordion> -->
          <!-- <template #header>{{ runnable.title }}</template> -->
        <!-- <Runnable :runnable="runnable"> -->
          <!-- <Suite :runnable="runnable" v-if="runnable.type === 'suite'"></Suite> -->
          <!-- <Test :runnable="runnable" v-if="runnable.type === 'test'"></Test> -->
        <!-- </Runnable> -->
        <RunnableSuite :runnable="runnable">
        </RunnableSuite>

            <!-- </Runnable> -->
        <!-- </BaseAccordion> -->
      </li>
    </ul>
  </Suspense>
</template>

<script lang="ts">
import { defineComponent, ref, h, computed, watch } from "vue";
import { useRunnablesStore } from '../store'
import Runnable from './Runnable.vue'
import BaseAccordion from '../components/BaseAccordion.vue'
import Suite from './suites/RunnableSuite.vue'
import Test from './tests/RunnableTest.vue'

import RunnableSuite from './suites/RunnableSuite.vue'

export default defineComponent({
  props: {
    // loaded: false,
    runnables: Object,
    root: null
  },
  components: {
    Runnable,
    BaseAccordion,
    RunnableSuite,
    Suite,
    Test
  },
  setup(props) {
    
    // return {
      // ...
      // root: computed(() => props.root),
      // children: props.root
    // }
    const runnablesStore = useRunnablesStore()

    // watch(runnablesStore, () => console.log(runnablesStore.runnables))
    return {
      runnablesStore,
      runnableComponent: (runnable) => runnable.type === 'suite' ? Suite : Test
      // tests: computed(() => props.root.tests)
      // tests: computed(() => props.root ? props.root.tests : []),
    }
  }
});
</script>
