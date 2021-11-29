<template>
  <WarningList :gql="props.gql" />
  <div class="mb-5 children:relative">
    <EnvironmentSetup
      v-if="wizardStore.wizardStep === 'selectFramework'"
      :gql="props.gql"
    />
    <InstallDependencies
      v-else-if="wizardStore.wizardStep === 'installDependencies'"
      :gql="props.gql"
    />
    <ConfigFiles
      v-else-if="wizardStore.wizardStep === 'configFiles'"
      :gql="props.gql"
    />
  </div>
</template>

<script lang="ts" setup>
import EnvironmentSetup from './EnvironmentSetup.vue'
import InstallDependencies from './InstallDependencies.vue'
import ConfigFiles from './ConfigFiles.vue'
import { gql } from '@urql/core'
import type { SetupComponentTestingWizardFragment } from '../generated/graphql'
import { useWizardStore } from '../store/wizardStore'

const wizardStore = useWizardStore()

gql`
fragment SetupComponentTestingWizard on Query {
  ...WarningList
  ...InstallDependencies
}`

const props = defineProps<{
  gql: SetupComponentTestingWizardFragment
}>()
</script>
