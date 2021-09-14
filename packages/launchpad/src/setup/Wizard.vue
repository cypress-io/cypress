<template>
  <WizardHeader :gql="props.gql.wizard" />
  <div class="mx-5">
    <EnvironmentSetup 
      v-if="props.gql.wizard.step === 'selectFramework'" 
      :gql="props.gql.wizard" 
    />
    <InstallDependencies 
      v-if="props.gql.wizard.step === 'installDependencies'" 
      :gql="props.gql.wizard" 
    />
    <ConfigFile 
      v-if="props.gql.wizard.step === 'createConfig'" 
      :gql="props.gql"
    />
    <InitializeConfig 
      v-if="props.gql.wizard.step === 'initializePlugins'" 
      :gql="props.gql"
    />
    <OpenBrowser v-if="props.gql.wizard.step === 'setupComplete'" />
  </div>
</template>

<script lang="ts" setup>
import EnvironmentSetup from "./EnvironmentSetup.vue";
import InstallDependencies from "./InstallDependencies.vue";
import ConfigFile from "./ConfigFile.vue";
import WizardHeader from "./WizardHeader.vue";
import OpenBrowser from "./OpenBrowser.vue";
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
  }
  ...ConfigFile
  ...InitializeConfig
}`

const props = defineProps<{
  gql: WizardFragment
}>()
</script>
