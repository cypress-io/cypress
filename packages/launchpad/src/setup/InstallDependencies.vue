<template>
  <WizardLayout 
    :next="nextButtonName" 
    alt="Install manually" 
    :altFn="altFn"
    :canNavigateForward="props.gql.canNavigateForward"
  >
    <PackagesList
      v-if="!isManualInstall" 
      :gql="props.gql" 
    />
    <ManualInstall 
      v-else 
      :gql="props.gql" 
    />
  </WizardLayout>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import WizardLayout from "./WizardLayout.vue";
import PackagesList from "./PackagesList.vue";
import ManualInstall from "./ManualInstall.vue";
import { gql } from '@urql/core'
import type { InstallDependenciesFragment } from "../generated/graphql";
import { useI18n } from "@cy/i18n";

gql`
fragment InstallDependencies on Wizard {
  ...PackagesList
  ...ManualInstall
  canNavigateForward
}
`

const isManualInstall = ref(false)

const props = defineProps<{
  gql: InstallDependenciesFragment
}>()

const { t } = useI18n()
const nextButtonName = computed(() =>
  isManualInstall.value ?
    t('setupPage.install.confirmManualInstall') :
    t('setupPage.install.startButton')
);

const altFn = (val: boolean) => {
  isManualInstall.value = val
}
</script>
