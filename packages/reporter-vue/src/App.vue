<template>
  <span v-if="isLoading">Loading...</span>
  <RunnableList
    v-else-if="isReady"
    :runnables="runnables"
    :key="runnables.file"
  >
    <!-- {{ runnables }} -->
    <!-- <template #="{ runnable }">
      <li>{{ runnable }}</li>
    </template> -->
  </RunnableList>
  <span v-else-if="isError">Errored</span>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, computed, reactive } from "vue";
import RunnableList from "./RunnableList.vue";

// type RunnerState = "loading" | "error" | "ready";
export default defineComponent({
  props: ["state", "reporterBus"],
  components: { RunnableList },
  setup(props) {
    const runner = props.reporterBus;
    const runnerState = ref("loading");
    const runnables = ref({});
    runner.on("run:start", (arg, arg2) => {});

    runner.on("runnables:ready", (rootRunnable = {}) => {
      runnerState.value = "ready";
      runnables.value = rootRunnable;
    });
    return {
      isReady: computed(() => runnerState.value === "ready"),
      isLoading: computed(() => runnerState.value === "loading"),
      isError: computed(() => runnerState.value === "error"),
      runnables,
    };

    // Object.keys(window.ReporterOptions).forEach((key) => {
    //   provide(key, window.ReporterOptions[key]);
    // });
    // console.log(window.ReporterOptions);
    // return { reporterOptions: computed(() => window.ReporterOptions) };
  },
});
</script>
