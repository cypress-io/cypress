<template>
  <WarningList :gql="props.gql" />
  <LaunchpadHeader
    :title="title"
    :description="description"
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
import { useI18n } from '@cy/i18n'

export type CurrentStep = 'selectFramework' | 'installDependencies'

const props = defineProps<{
  gql: WizardFragment
}>()

const { t } = useI18n()

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

const title = computed(() => t(`setupWizard.${currentStep.value}.title`))
const description = computed(() => t(`setupWizard.${currentStep.value}.description`))
</script>
