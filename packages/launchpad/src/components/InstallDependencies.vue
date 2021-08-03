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
import { computed, defineComponent, PropType } from "vue";
import WizardLayout from "./WizardLayout.vue";
import PackagesList from "./PackagesList.vue";
import ManualInstall from "./ManualInstall.vue";
import { gql } from '@urql/core'
import { useMutation } from "@urql/vue";
import { InstallDependenciesFragment, InstallDependenciesManualInstallDocument } from "../generated/graphql";

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
  props: {
    gql: {
      type: Object as PropType<InstallDependenciesFragment>,
      required: true
    }
  },
  setup(props) {
    const toggleManual = useMutation(InstallDependenciesManualInstallDocument)
    const nextButtonName = computed(() =>
      props.gql.isManualInstall ? "I've installed them" : "Install"
    );

    return { 
      manualInstall: computed(() => props.gql.isManualInstall),
      nextButtonName, 
      gql: computed(() => props.gql),
      altFn (val: boolean) {
        toggleManual.executeMutation({ isManual: val })
      }
    };
  },
});
</script>
