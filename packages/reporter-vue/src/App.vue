<template>
  <div>{{ store.counter }}</div>
</template>

<script lang="ts">
import { defineComponent, watch } from "vue";
import { defineStore } from "pinia";
import { useMagicKeys } from './composables/core'
// import ReporterHeader from "./header/ReporterHeader.vue";


const useStore = defineStore({
  id: "main",
  state: () => ({
    counter: 0,
  }),
  getters: {
    // type is automatically inferred because we are not using `this`
    doubleCount: (state) => state.counter * 2,
    // here we need to add the type ourselves (using JSDoc in JS). We can also
    // use this to document the getter
    /**
     * Returns the counter value times two plus one.
     *
     * @returns {number}
     */
    doubleCountPlusOne() {
      // autocompletion ✨
      return this.doubleCount + 1;
    },
  },
});

export default defineComponent({
  name: "App",
  props: ["reporterBus", "state"],
  // components: { ReporterHeader },
  setup(props) {
    const keys = useMagicKeys()
    // watch(keys.r, rerun)
    // watch(keys.b, stopRunning)
    // watch(keys.a, toggleAutoScrolling)

    const store = useStore();

    // store.number;
    return { store };
  },
});
</script>
