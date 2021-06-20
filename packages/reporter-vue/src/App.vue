<template>
  <div>
    <ReporterHeader/>
    <RunnableHeader>
        my/spec/file.spec.js
    </RunnableHeader>
    <RunnablesList :root="runnablesStore.rootRunnable">
      <template #loading>
        Loading...
      </template>
      {{runnablesStore.rootRunnable}}
      
    </RunnablesList>
  </div>
</template>

<script lang="ts" setup>
// import { defineComponent, watch } from "vue";
// import { useMagicKeys } from './composables/core'
import { useReporterStore, useRunnablesStore } from './store'
import { watch, defineProps } from 'vue'
import ReporterHeader from './header/ReporterHeader.vue'
import RunnableHeader from './runnables/RunnableHeader.vue'
import SuiteOrTests from './runnables/SuiteOrTests.vue'
import RunnablesList from './runnables/RunnablesList.vue'

const props = defineProps(['reporterBus', 'state'])

const reporterStore = useReporterStore();
const runnablesStore = useRunnablesStore();
reporterStore.bus = props.reporterBus
reporterStore.init()

// export default defineComponent({
//   name: "App",
//   props: ["reporterBus", "state"],
//   // components: { ReporterHeader },
//   setup(props) {
//     // const keys = useMagicKeys()
//     // watch(keys.r, rerun)
//     // watch(keys.b, stopRunning)
//     // watch(keys.a, toggleAutoScrolling)

//     // const store = useStore();

//     // store.number;
//     // return { store };
//   },
// });
</script>
