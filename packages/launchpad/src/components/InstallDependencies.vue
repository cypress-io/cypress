<template>
  <WizardLayout :next="nextButtonName" alt="Install manually">
    <PackagesList v-if="!manualInstall" />
    <ManualInstall v-else @back="manualInstall = false" />
  </WizardLayout>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import WizardLayout from "./WizardLayout.vue";
import PackagesList from "./PackagesList.vue";
import ManualInstall from "./ManualInstall.vue";
import { useStoreApp } from "../store/app";

export default defineComponent({
  components: {
    WizardLayout,
    PackagesList,
    ManualInstall,
  },
  setup() {
    const store = useStoreApp();
    const manualInstall = ref(false);
    const nextButtonName = computed(() =>
      manualInstall.value ? "I've installed them" : "Install"
    );
    onMounted(() => {
      store.setMeta({
        title: "Install Dev Dependencies",
        description:
          "We need to install the following packages in order for component testing to work.",
      });

      store.onAlt(() => {
        manualInstall.value = !manualInstall.value;
      });

      store.onBack(() => {
        store.flagComponentSetup(false);
      });

      store.onNext(() => {
        if (manualInstall.value) {
          store.flagDependenciesInstalled();
        } else {
        }
      });
    });
    return { manualInstall, nextButtonName };
  },
});
</script>
