<template>
  <WizardLayout :next="nextButtonName" alt="Install manually" :altFn="altFn">
    <PackagesList
      v-if="!manualInstall" 
      :gql="gql" 
    />
    <ManualInstall 
      v-else 
      @back="manualInstall = false" 
      :gql="gql || []" 
    />
  </WizardLayout>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import WizardLayout from "./WizardLayout.vue";
import PackagesList from "./PackagesList.vue";
import ManualInstall from "./ManualInstall.vue";
import { gql } from '@urql/core'

gql`
fragment InstallDependencies on Wizard {
  ...PackagesList
  ...ManualInstall
  isManualInstall
}
`

gql`
mutation InstallDependenciesManualInstall($isManual: Boolean!) {
  wizardSetManualInstall(isManual: $isManual) {
    ...InstallDependencies
  }
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
    // useMutation(InstallDependenciesManualInstallDocument)
    const manualInstall = ref(false);
    const nextButtonName = computed(() =>
      manualInstall.value ? "I've installed them" : "Install"
    );
    onMounted(() => {
      // store.onAlt(() => {
      //   manualInstall.value = !manualInstall.value;
      // });

      // store.onBack(() => {
      //   store.flagComponentSetup(false);
      // });

      // store.onNext(() => {
      //   if (manualInstall.value) {
      //     store.flagDependenciesInstalled();
      //   } else {
      //   }
      // });
    });
    
    return { 
      manualInstall, 
      nextButtonName, 
      gql: computed(() => props.gql),
      altFn() {}
    };
  },
});
</script>
