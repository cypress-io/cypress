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
      :data="wizardSetupData"
      @navigate="setCurrentStep"
      @wizard-setup="onWizardSetup"
    />
    <InstallDependencies
      v-if="currentStep === 'installDependencies'"
      :gql="props.gql"
      @navigate="setCurrentStep"
    />
  </div>
</template>

<script lang="ts" setup>
import EnvironmentSetup from './EnvironmentSetup.vue'
import InstallDependencies from './InstallDependencies.vue'
import { gql } from '@urql/core'
import { CodeLanguageEnum, WizardFragment, Wizard_WizardUpdateDocument } from '../generated/graphql'
import WarningList from '../warning/WarningList.vue'
import { computed, ref } from 'vue'
import type { FrontendFramework, Bundler } from '@packages/types/src/constants'
import LaunchpadHeader from './LaunchpadHeader.vue'
import { useI18n } from '@cy/i18n'
import { useMutation } from '@urql/vue'

const props = defineProps<{
  gql: WizardFragment
}>()

const { t } = useI18n()

export interface WizardSetupData {
  bundler: Bundler['type'] | null
  framework: FrontendFramework['type'] | null
  codeLanguage: CodeLanguageEnum
}

gql`
mutation Wizard_wizardUpdate($input: WizardUpdateInput!) {
  wizardUpdate(input: $input)
}
`

export type CurrentStep = 'selectFramework' | 'installDependencies'

const currentStep = ref<CurrentStep>('selectFramework')
const wizardSetupData = ref<WizardSetupData>({
  bundler: props.gql.wizard.bundler?.type ?? null,
  framework: props.gql.wizard.framework?.type ?? null,
  codeLanguage: 'js',
})

const wizardUpdateMutation = useMutation(Wizard_WizardUpdateDocument)

const onWizardSetup = <K extends keyof WizardSetupData>(key: K, val: WizardSetupData[K]) => {
  wizardSetupData.value[key] = val
  wizardUpdateMutation.executeMutation({
    input: wizardSetupData.value,
  })
}

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
