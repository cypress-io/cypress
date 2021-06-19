<template>
  <div>
    <ReporterHeader/>
    <RunnableHeader>
      my/spec/file.spec.js
    </RunnableHeader>
  </div>
</template>

<script lang="ts" setup>
// import { defineComponent, watch } from "vue";
// import { useMagicKeys } from './composables/core'
import { defineProps } from 'vue'
import ReporterHeader from './header/ReporterHeader.vue'
import RunnableHeader from './runnables/RunnableHeader.vue'

defineProps(['reporterBus', 'state'])


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
