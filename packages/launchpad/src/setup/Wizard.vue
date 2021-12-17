<template>
  <WarningList :gql="props.gql.wizard" />
  <LaunchpadHeader
    :title="title"
    :description="description"
  />
  <div class="mb-5 children:relative">
    <EnvironmentSetup
      v-if="currentStep === 'selectFramework'"
      :gql="props.gql.wizard"
      :data="wizardSetupData"
      @navigate="setCurrentStep"
    />
    <InstallDependencies
      v-if="currentStep === 'installDependencies'"
      :gql="props.gql"
      @navigate="setCurrentStep"
    />
    <ConfigFiles
      v-if="currentStep === 'configFiles'"
      :gql="props.gql.wizard"
      @navigate="setCurrentStep"
    />
  </div>
</template>

<script lang="ts" setup>
import EnvironmentSetup from './EnvironmentSetup.vue'
import InstallDependencies from './InstallDependencies.vue'
import ConfigFiles from './ConfigFiles.vue'
import { gql } from '@urql/core'
import type { CodeLanguageEnum, WizardFragment } from '../generated/graphql'
import WarningList from '../warning/WarningList.vue'
import { computed, ref } from 'vue'
import type { FrontendFramework, Bundler } from '@packages/types/src/constants'
import LaunchpadHeader from './LaunchpadHeader.vue'
import { useI18n } from '@cy/i18n'

export interface WizardSetupData {
  bundler?: Bundler['type']
  framework?: FrontendFramework['type']
  codeLanguage?: CodeLanguageEnum
}

export type CurrentStep = 'selectFramework' | 'installDependencies' | 'configFiles'

const currentStep = ref<CurrentStep>('selectFramework')
const wizardSetupData = ref<WizardSetupData>({})

const setCurrentStep = (step: CurrentStep) => {
  currentStep.value = step
}

gql`
fragment Wizard on Query {
  wizard {
    ...EnvironmentSetup
    ...ConfigFiles
    ...WarningList
  }
  ...InstallDependencies
}`

const props = defineProps<{
  gql: WizardFragment
}>()

const { t } = useI18n()

const title = computed(() => t(`setupWizard.${currentStep.value}.title`))
const description = computed(() => t(`setupWizard.${currentStep.value}.description`))
</script>
