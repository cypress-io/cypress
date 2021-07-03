<template>
  <WizardLayout>
    <div class="m-5">
      <Select
        name="Front-end Framework"
        @select="setFEFramework"
        :options="frameworks"
        :value="selectedFrameworkId"
        placeholder="Pick a framework"
      />
      <Select
        name="Bundler"
        v-if="!hiddenBundlerSelect"
        @select="setFEBundler"
        :options="bundlers"
        :value="selectedBundlerId"
        placeholder="Pick a bundler"
      />
    </div>
  </WizardLayout>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import WizardLayout from "./WizardLayout.vue";
import Select from "./Select.vue";

import { useStore } from "../store";
import { Framework, supportedFrameworks } from "../utils/frameworks";
import { Bundler, supportedBundlers } from "../utils/bundler";

export default defineComponent({
  components: { WizardLayout, Select },
  props: {
    detectedFramework: {
      type: String,
      default: "none",
    },
    detectedBundler: {
      type: String,
      default: "none",
    },
  },
  setup(props) {
    const store = useStore();

    const selectedFramework = ref<Framework | undefined>(undefined);
    const selectedFrameworkId = ref(props.detectedFramework);
    const selectedBundler = ref<Bundler | undefined>(undefined);
    const selectedBundlerId = ref(props.detectedBundler);

    onMounted(() => {
      store.setMeta({
        title: "Project Setup",
        description:
          "Confirm the front-end framework and bundler used in your project.",
      });

      store.onBack(() => {
        store.setTestingType(undefined);
      });

      store.onNext(() => {
        if (!selectedFramework.value || !selectedBundler.value) {
          return;
        }
        store.setComponentSetup({
          framework: selectedFramework.value,
          bundler: selectedBundler.value,
          complete: true,
        });
      });

      const initialComponent = store.getState().component;

      if (initialComponent) {
        setFEFramework(initialComponent.framework);
        setFEBundler(initialComponent.bundler);
      }
    });

    const fwBundlerId = computed(() => selectedFramework?.value?.bundler);
    const hiddenBundlerSelect = ref(false);

    const setFEBundler = (bundler: Bundler) => {
      selectedBundler.value = bundler;
      selectedBundlerId.value = bundler.id;
    };

    const bundlers = supportedBundlers.map(
      (bundler: Bundler & { description?: string }) => {
        if (bundler.id === props.detectedBundler) {
          bundler.description = "(detected)";
          setFEBundler(bundler);
        }
        return bundler;
      }
    );

    const setFEFramework = (framework: Framework) => {
      selectedFrameworkId.value = framework.id;
      selectedFramework.value = framework;
      hiddenBundlerSelect.value = !!fwBundlerId.value;
      if (fwBundlerId.value) {
        const foundBundler = supportedBundlers.find(
          (bund) => bund.id === fwBundlerId.value
        );
        if (foundBundler) {
          setFEBundler(foundBundler);
        }
      }
    };

    const frameworks = supportedFrameworks.map(
      (framework: Framework & { description?: string }) => {
        if (framework.id === props.detectedFramework) {
          framework.description = "(detected)";
          setFEFramework(framework);
        }
        return framework;
      }
    );

    return {
      setFEFramework,
      setFEBundler,
      frameworks,
      selectedFrameworkId,
      bundlers,
      selectedBundlerId,
      hiddenBundlerSelect,
    };
  },
});
</script>
