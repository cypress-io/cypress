<template>
  <WizardLayout :next="nextButtonName" alt="Install manually" :altFn="altFn">
    <PackagesList
      v-if="!manualInstall" 
      :packagesToInstall="packagesToInstall || []" 
    />
    <ManualInstall 
      v-else 
      @back="manualInstall = false" 
      :packagesToInstall="packagesToInstall || []" 
    />
  </WizardLayout>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { PackagesToInstallDocument } from "../generated/graphql";
import { useQuery, useResult } from "@vue/apollo-composable";
import { gql } from '@apollo/client'
import WizardLayout from "./WizardLayout.vue";
import PackagesList from "./PackagesList.vue";
import ManualInstall from "./ManualInstall.vue";

gql`
fragment InstallDependencies on Wizard {
  ...PackagesList
  ...ManualInstall
}
`

gql`
query PackagesToInstall {
  wizard {
    packagesToInstall {
      name
    }
  }
}
`

export interface Pkg { name: string, description: string }

export default defineComponent({
  components: {
    WizardLayout,
    PackagesList,
    ManualInstall,
  },
  setup() {
    const manualInstall = ref(false);
    const nextButtonName = computed(() =>
      manualInstall.value ? "I've installed them" : "Install"
    );

    const altFn = (val: boolean) => {
      manualInstall.value = val
    }

    // TODO: Why do I need pollInterval?
    const { result } = useQuery(PackagesToInstallDocument, null, { pollInterval: 1000 })

    const packagesToInstall = useResult(result, null, data => {
      return data?.wizard?.packagesToInstall?.map(x => ({
        name: x.name, 
        description: 'TODO: Description', 
       })) || []
    })

    return {
      altFn,
      packagesToInstall,
      manualInstall,
      nextButtonName,
    };
  },
});
</script>
