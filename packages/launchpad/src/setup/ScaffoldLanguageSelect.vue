<template>
  <WarningList :gql="props.gql" />
  <LaunchpadHeader
    :title="title"
    :description="description"
  />
  <div class="mb-5 children:relative">
    <WizardLayout
      class="max-w-640px"
      :back-fn="onBack"
      :next-fn="onScaffoldConfirm"
      :can-navigate-forward="true"
    >
      <div class="m-24px">
        <SelectLanguage
          :name="t('setupPage.projectSetup.configFileLanguageLabel')"
          :options="languages || []"
          :value="props.gql.wizard.language?.id ?? 'js'"
          @select="val => onLanguageSelect(val)"
        />
      </div>
    </WizardLayout>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { CodeLanguageEnum, EnvironmentSetup_ClearTestingTypeDocument, ScaffoldLanguageSelectFragment, ScaffoldLanguageSelect_ScaffoldTestingTypeDocument, ScaffoldLanguageSelect_WizardUpdateDocument } from '../generated/graphql'
import WarningList from '../warning/WarningList.vue'
import { computed } from 'vue'
import type { FrontendFramework, Bundler } from '@packages/types/src/constants'
import LaunchpadHeader from './LaunchpadHeader.vue'
import { useI18n } from '@cy/i18n'
import SelectLanguage from './SelectLanguage.vue'
import { useMutation } from '@urql/vue'
import WizardLayout from './WizardLayout.vue'

export interface WizardSetupData {
  bundler: Bundler['type'] | null
  framework: FrontendFramework['type'] | null
  codeLanguage: CodeLanguageEnum
}

const props = defineProps<{
  gql: ScaffoldLanguageSelectFragment
}>()

const { t } = useI18n()

gql`
mutation ScaffoldLanguageSelect_wizardUpdate($input: WizardUpdateInput!) {
  wizardUpdate(input: $input) {
    allLanguages {
      id
      name
      type
    }
  }
}
`

gql`
mutation ScaffoldLanguageSelect_scaffoldTestingType {
  scaffoldTestingType {
    currentProject {
      id
      isE2EConfigured
    }
    ...ScaffoldedFiles
  }
}

`

const wizardUpdateMutation = useMutation(ScaffoldLanguageSelect_WizardUpdateDocument)
const scaffoldTestingTypeMutation = useMutation(ScaffoldLanguageSelect_ScaffoldTestingTypeDocument)
const clearTestingTypeMutation = useMutation(EnvironmentSetup_ClearTestingTypeDocument)

const onLanguageSelect = (codeLanguage) => {
  wizardUpdateMutation.executeMutation({
    input: {
      bundler: null,
      framework: null,
      codeLanguage: codeLanguage ?? 'js',
    },
  })
}

const onScaffoldConfirm = () => {
  scaffoldTestingTypeMutation.executeMutation({})
}

const onBack = () => {
  clearTestingTypeMutation.executeMutation({})
}

gql`
fragment ScaffoldLanguageSelect on Query {
  ...WarningList
  wizard {
    language {
      id
      name
      isSelected
      type
    }
    allLanguages {
      id
      name
      type
    }
  }
}`

const title = computed(() => t(`setupWizard.selectFramework.title`))
const description = computed(() => t(`setupWizard.selectFramework.description`))

const languages = computed(() => props.gql.wizard.allLanguages ?? [])

</script>
