<template>
  <WizardLayout
    :next=" t('setupPage.install.confirmManualInstall')"
    :can-navigate-forward="true"
    :back-fn="() => emits('navigate', 'selectFramework')"
    :next-fn="confirmInstalled"
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
import { InstallDependenciesFragment, InstallDependencies_ScaffoldFilesDocument } from '../generated/graphql'
import type { CurrentStep } from './Wizard.vue'
import { useI18n } from '@cy/i18n'
import { useMutation } from '@urql/vue'

gql`
mutation InstallDependencies_scaffoldFiles {
  scaffoldTestingType {
    ...ScaffoldedFiles
  }
}
`

const emits = defineEmits<{
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
const mutation = useMutation(InstallDependencies_ScaffoldFilesDocument)

const confirmInstalled = () => {
  mutation.executeMutation({})
}

</script>
