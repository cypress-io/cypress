<template>
  <WarningList :gql="props.gql.wizard" />
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
import type { WizardFragment } from '../generated/graphql'
import { useWizardStore } from '../store/wizardStore'

const wizardStore = useWizardStore()

gql`
fragment Wizard on Query {
  ...WarningList
  ...InstallDependencies
}`

const props = defineProps<{
  gql: WizardFragment
}>()
</script>
