<template>
  <WarningList :gql="props.gql.wizard" />
  <WizardHeader
    v-if="props.gql.wizard"
    :gql="props.gql.wizard"
  />
  <div class="mb-5 children:relative">
    <EnvironmentSetup
      v-if="props.gql.wizard.step === 'selectFramework'"
      :gql="props.gql.wizard"
    />
    <InstallDependencies
      v-if="props.gql.wizard.step === 'installDependencies'"
      :gql="props.gql"
    />
    <ConfigFiles
      v-if="props.gql.wizard.step === 'configFiles'"
      :gql="props.gql.wizard"
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
import WarningList from '../warning/WarningList.vue'

gql`
fragment Wizard on Query {
  wizard {
    title
    description
    step
    testingType
    ...EnvironmentSetup
    ...ConfigFiles
    ...WarningList
  }
  ...InstallDependencies
}`

const props = defineProps<{
  gql: WizardFragment
}>()
</script>
