<template>
  <WizardLayout
    :title="t('setupPage.projectSetup.title')"
    :description="t('setupPage.projectSetup.description')"
    :back-fn="backFn"
    :can-navigate-forward="canNavigateForward"
    class="max-w-776px"
  >
    <div class="m-5">
      <SelectFramework
        :name="t('setupPage.projectSetup.frameworkLabel')"
        :options="FRONTEND_FRAMEWORKS"
        :value="wizardStore.wizardFramework"
        :placeholder="t('setupPage.projectSetup.frameworkPlaceholder')"
        @select="setFEFramework"
      />
      <SelectBundler
        :name="t('setupPage.projectSetup.bundlerLabel')"
        :disabled="wizardStore.bundlerOptions.length === 1"
        :options="wizardStore.bundlerOptions"
        :value="wizardStore.wizardBundler"
        :placeholder="t('setupPage.projectSetup.bundlerPlaceholder')"
        @select="setFEBundler"
      />
      <SelectLanguage
        :name="t('setupPage.projectSetup.languageLabel')"
        :options="CODE_LANGUAGES"
        :value="wizardStore.wizardCodeLanguage"
        @select="setLanguage"
      />
    </div>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import WizardLayout from './WizardLayout.vue'
import SelectFramework from '../components/select/SelectFramework.vue'
import SelectBundler from '../components/select/SelectBundler.vue'
import SelectLanguage from '../components/select/SelectLanguage.vue'
import { gql } from '@urql/core'
import {
  FrontendFrameworkEnum,
  CodeLanguageEnum,
  EnvironmentSetup_ClearTestingTypeDocument,
} from '../generated/graphql'
import { useWizardStore } from '../store/wizardStore'
import { CODE_LANGUAGES, FRONTEND_FRAMEWORKS, BUNDLERS, Bundler } from '@packages/types/src/constants'
import { useMutation } from '@urql/vue'
import { useI18n } from '@cy/i18n'

const wizardStore = useWizardStore()

gql`
mutation EnvironmentSetup_clearTestingType {
  clearCurrentTestingType {
    currentProject {
      id
      currentTestingType
    }
    wizard {
      ...Wizard
    }
  }
}
`

const clearTestingType = useMutation(EnvironmentSetup_ClearTestingTypeDocument)

const setFEBundler = (bundler: Bundler['type']) => {
  wizardStore.setBundler(bundler)
}

const setFEFramework = (framework: FrontendFrameworkEnum) => {
  wizardStore.setFramework(framework)
}

const setLanguage = (language: CodeLanguageEnum) => {
  wizardStore.setCodeLanguage(language)
}

const { t } = useI18n()

const backFn = () => {
  return clearTestingType.executeMutation({})
}

const canNavigateForward = computed(() => {
  return Boolean(wizardStore.wizardBundler && wizardStore.wizardFramework)
})
</script>
