<template>
  <WizardLayout :next="nextButtonName" :alt="altButtonName">
    <PackagesList v-if="!manualInstall" />
    <ManualInstall v-else />
  </WizardLayout>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { useStore } from "../store";
import WizardLayout from "./WizardLayout.vue";
import PackagesList from "./PackagesList.vue";
import ManualInstall from "./ManualInstall.vue";

function installIt() {}

export default defineComponent({
  components: {
    WizardLayout,
    PackagesList,
    ManualInstall,
  },
  setup() {
    const store = useStore();
    const manualInstall = ref(false);
    const nextButtonName = computed(() =>
      manualInstall.value ? "I've installed them" : "Install"
    );
    const altButtonName = computed(() =>
      manualInstall.value
        ? "Install automatically"
        : "Install these packages manually"
    );
    onMounted(() => {
      store.setMeta({
        title: "Install Dev Dependencies",
        description:
          "We need to install the following packages in order for component testing to work.",
      });

      store.setAltFunction(() => {
        manualInstall.value = true;
      });

      store.setBackFunction(() => {
        store.resetComponentSetup();
      });

      store.setNextFunction(() => {
        installIt();
      });
    });
    return { manualInstall, nextButtonName, altButtonName };
  },
});
</script>
