<template>
  <WizardLayout
    :next="nextButtonName"
    alt="Install manually"
    :alt-fn="altFn"
    :can-navigate-forward="props.gql.canNavigateForward"
  >
    <PackagesList
      v-if="!manualInstall"
      :gql="props.gql"
    />
    <ManualInstall
      v-else
      :gql="props.gql"
      @back="manualInstall = false"
    />
  </WizardLayout>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import WizardLayout from './WizardLayout.vue'
import PackagesList from './PackagesList.vue'
import ManualInstall from './ManualInstall.vue'
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import { InstallDependenciesFragment, InstallDependenciesManualInstallDocument } from '../generated/graphql'
import { useI18n } from '../composables'

gql`
fragment InstallDependencies on Wizard {
  ...PackagesList
  ...ManualInstall
  isManualInstall
  canNavigateForward
}
`

gql`
mutation InstallDependenciesManualInstall($isManual: Boolean!) {
  wizardSetManualInstall(isManual: $isManual) {
    ...InstallDependencies
  }
}
`

const props = defineProps<{
  gql: InstallDependenciesFragment
}>()

const { t } = useI18n()
const toggleManual = useMutation(InstallDependenciesManualInstallDocument)
const nextButtonName = computed(() => {
  return props.gql.isManualInstall ?
    t('setupPage.install.confirmManualInstall') :
    t('setupPage.install.startButton')
})

const manualInstall = computed(() => props.gql.isManualInstall)

const altFn = (val: boolean) => {
  toggleManual.executeMutation({ isManual: val })
}
</script>
