<template>
  <WizardLayout
    :next=" t('setupPage.install.confirmManualInstall')"
    :can-navigate-forward="props.gql.canNavigateForward"
    class="max-w-640px"
  >
    <ManualInstall
      :gql="props.gql"
    />
  </WizardLayout>
</template>

<script lang="ts" setup>
import WizardLayout from './WizardLayout.vue'
import ManualInstall from './ManualInstall.vue'
import { gql } from '@urql/core'
import type { InstallDependenciesFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

gql`
fragment InstallDependencies on Wizard {
  ...ManualInstall
  canNavigateForward
}
`

const props = defineProps<{
  gql: InstallDependenciesFragment
}>()

const { t } = useI18n()

</script>
