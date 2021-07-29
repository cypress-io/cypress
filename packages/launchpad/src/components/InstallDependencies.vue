<template>
  <WizardLayout :next="nextButtonName" alt="Install manually">
    <PackagesList v-if="!manualInstall" :gql="gql" />
    <ManualInstall v-else @back="manualInstall = false" :gql="gql" />
  </WizardLayout>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import WizardLayout from "./WizardLayout.vue";
import PackagesList from "./PackagesList.vue";
import ManualInstall from "./ManualInstall.vue";
import { useStoreApp } from "../store/app";
import { gql } from '@apollo/client'

gql`
fragment InstallDependencies on Wizard {
  ...PackagesList
  ...ManualInstall
}
`

export default defineComponent({
  components: {
    WizardLayout,
    PackagesList,
    ManualInstall,
  },
  props: ['gql'],
  setup(props) {
    const store = useStoreApp();
    const manualInstall = ref(false);
    const nextButtonName = computed(() =>
      manualInstall.value ? "I've installed them" : "Install"
    );
    onMounted(() => {
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
    return { manualInstall, nextButtonName, gql: props.gql };
  },
});
</script>
