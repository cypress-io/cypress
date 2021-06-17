<template>
  <div class="vueApp">
    <BaseModal @close="showModal = false" v-if="showModal">
      <template #body>Content</template>
    </BaseModal>
    <!-- <ReporterLoading v-if="runnerState === 'loading'" />
    <ReporterError v-if="runnerState === 'error'" />
    <ReporterNoTests v-if="runnerState === 'noTests'" :spec="state.spec" />
    <RunnablesList v-if="runnerState === 'ready'" /> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, computed, reactive } from "vue";
import ReporterLoading from "./views/ReporterLoading.vue";
import ReporterError from "./views/ReporterError.vue";
import ReporterNoTests from "./views/ReporterNoTests.vue";
import RunnablesList from "./runnables/RunnablesList.vue";
import BaseModal from "./components/BaseModal.vue";

// type RunnerState = "loading" | "error" | "ready";
// interface Runnables {}

export default defineComponent({
  props: ["state", "reporterBus"],
  components: {
    BaseModal,
    ReporterLoading,
    ReporterError,
    ReporterNoTests,
    RunnablesList,
  },
  setup(props) {
    const runner = props.reporterBus;
    const runnerState = ref("loading");
    const runnables = ref({});
    runner.on("run:start", (arg, arg2) => {});

    runner.on("runnables:ready", (rootRunnable) => {
      runnables.value = rootRunnable;
      if (!rootRunnable) {
        runnerState.value = "noTests";
        return;
      }
      runnerState.value = "ready";
    });
    return {
      showModal: ref(true),
      runnerState,
      runnables,
      state: props.state,
    };
  },
});
</script>

<style lang="scss" scoped>
.vueApp {
  padding: 0 2rem;
}

.fade-enter-active {
  animation: fade 0.5s;
}
.fade-leave-active {
  animation: fade 0.5s reverse;
}

@keyframes fade {
  0% {
    transform: opacity(0);
  }

  50% {
    transform: opacity(0.5)''
  }

  100% {
    transform: opacity(1);
  }
}
</style>