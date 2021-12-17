<template>
  <WizardLayout
    :next=" t('setupPage.install.confirmManualInstall')"
    :can-navigate-forward="true"
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
import type { CurrentStep } from './Wizard.vue'
import { useI18n } from '@cy/i18n'

defineEmits<{
  (event: 'navigate', currentStep: CurrentStep): void
}>()

gql`
fragment InstallDependencies on Query {
  ...ManualInstall
}
`

const props = defineProps<{
  gql: InstallDependenciesFragment
}>()

const { t } = useI18n()

</script>
