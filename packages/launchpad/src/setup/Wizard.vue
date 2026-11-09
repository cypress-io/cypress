<template>
  <WarningList :gql="props.gql" />
  <LaunchpadHeader
    :title="header.title"
    :description="header.description"
  />
  <div class="mb-5 children:relative">
    <EnvironmentSetup
      v-if="currentStep === 'selectFramework'"
      :gql="props.gql.wizard"
      :next-fn="() => setCurrentStep('installDependencies')"
    />
    <InstallDependencies
      v-if="currentStep === 'installDependencies'"
      :gql="props.gql"
      :back-fn="() => setCurrentStep('selectFramework')"
    />
  </div>
</template>

<script lang="ts" setup>
import EnvironmentSetup from './EnvironmentSetup.vue'
import InstallDependencies from './InstallDependencies.vue'
import { gql } from '@urql/core'
import type { WizardFragment } from '../generated/graphql'
import WarningList from '../warning/WarningList.vue'
import { computed, ref } from 'vue'
import LaunchpadHeader from './LaunchpadHeader.vue'

type CurrentStep = 'selectFramework' | 'installDependencies'

const props = defineProps<{
  gql: WizardFragment
}>()

const currentStep = ref<CurrentStep>('selectFramework')

const setCurrentStep = (step: CurrentStep) => {
  currentStep.value = step
}

gql`
fragment Wizard on Query {
  ...ScaffoldedFiles
  ...WarningList
  wizard {
    ...EnvironmentSetup
    bundler {
      id
      type
    }
    framework {
      id
      type
    }
  }
  ...InstallDependencies
}`

const stepHeaders: Record<CurrentStep, { title: string, description: string }> = {
  selectFramework: {
    title: 'Project setup',
    description: 'Confirm the front-end framework and bundler used in your project.',
  },
  installDependencies: {
    title: 'Install dev dependencies',
    description: 'Based on your previous selection, the following dependencies are required.',
  },
}

const header = computed(() => stepHeaders[currentStep.value])
</script>
