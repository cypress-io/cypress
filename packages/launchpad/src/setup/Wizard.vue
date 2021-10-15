<template>
  <WizardHeader
    v-if="props.gql.wizard"
    :gql="props.gql.wizard"
  />
  <div class="mb-5">
    <EnvironmentSetup
      v-if="props.gql.wizard.step === 'selectFramework'"
      :gql="props.gql.wizard"
    />
    <InstallDependencies
      v-if="props.gql.wizard.step === 'installDependencies'"
      :gql="props.gql.wizard"
    />
    <ConfigFiles
      v-if="props.gql.wizard.step === 'configFiles'"
      :gql="props.gql.wizard"
    />
    <InitializeConfig
      v-if="props.gql.wizard.step === 'initializePlugins'"
      :gql="props.gql"
    />
    <OpenBrowser v-if="props.gql.wizard.step === 'setupComplete'" />
  </div>
</template>

<script lang="ts" setup>
import EnvironmentSetup from './EnvironmentSetup.vue'
import InstallDependencies from './InstallDependencies.vue'
import ConfigFiles from './ConfigFiles.vue'
import WizardHeader from './WizardHeader.vue'
import OpenBrowser from './OpenBrowser.vue'
import { gql } from '@urql/core'
import type { WizardFragment } from '../generated/graphql'
import InitializeConfig from './InitializeConfig.vue'

gql`
fragment Wizard on Query {
  wizard {
    title
    description
    step
    testingType
    ...EnvironmentSetup
    ...InstallDependencies
    ...ConfigFiles
  }
  ...InitializeConfig_Config
}`

const props = defineProps<{
  gql: WizardFragment
}>()
</script>
