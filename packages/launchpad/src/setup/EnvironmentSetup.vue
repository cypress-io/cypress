<template>
  <WizardLayout
    :can-navigate-forward="props.gql.canNavigateForward"
    class="max-w-640px"
  >
    <div class="m-24px">
      <SelectFwOrBundler
        :options="frameworks || []"
        :value="props.gql.framework?.id ?? undefined"
        :placeholder="t('setupPage.projectSetup.frameworkPlaceholder')"
        :label="t('setupPage.projectSetup.frameworkLabel')"
        selector-type="framework"
        data-testid="select-framework"
        @select-framework="setFEFramework"
      />
      <SelectFwOrBundler
        v-if="props.gql.framework?.id && (!props.gql.bundler || bundlers.length > 1)"
        class="pt-3px"
        :options="bundlers || []"
        :value="props.gql.bundler?.id ?? undefined"
        :placeholder="t('setupPage.projectSetup.bundlerPlaceholder')"
        :label="t('setupPage.projectSetup.bundlerLabel')"
        selector-type="bundler"
        data-testid="select-bundler"
        @select-bundler="setFEBundler"
      />
      <SelectLanguage
        :name="t('setupPage.projectSetup.languageLabel')"
        :options="languages || []"
        :value="props.gql.language?.id ?? 'js'"
        @select="setLanguage"
      />
    </div>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import WizardLayout from './WizardLayout.vue'
import SelectFwOrBundler from './SelectFwOrBundler.vue'
import SelectLanguage from './SelectLanguage.vue'
import { gql } from '@urql/core'
import {
  EnvironmentSetupFragment,
  EnvironmentSetupSetFrameworkDocument,
  EnvironmentSetupSetBundlerDocument,
  EnvironmentSetupSetCodeLanguageDocument,
  FrontendFrameworkEnum,
  SupportedBundlers,
  CodeLanguageEnum,
} from '../generated/graphql'
import { useMutation } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import { sortBy } from 'lodash'

gql`
mutation EnvironmentSetupSetFramework($framework: FrontendFrameworkEnum!) {
  wizardSetFramework(framework: $framework) 
}
`

gql`
mutation EnvironmentSetupSetBundler($bundler: SupportedBundlers!) {
  wizardSetBundler(bundler: $bundler) 
}
`

gql`
mutation EnvironmentSetupSetCodeLanguage($language: CodeLanguageEnum!) {
  wizardSetCodeLanguage(language: $language)
}
`

gql`
fragment EnvironmentSetup on Wizard {
  canNavigateForward
  bundler {
    id
    name
    type
    isSelected
  }
  framework {
    type
    id
    name
    isSelected
    supportedBundlers {
      id
      type
      name
    }
    category
  }
  frameworks {
    id
    name
    isSelected
    type
    category
  }
  allBundlers {
    id
    name
    type
  }
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
`

const props = defineProps<{
  gql: EnvironmentSetupFragment
}>()

const setFramework = useMutation(EnvironmentSetupSetFrameworkDocument)
const setBundler = useMutation(EnvironmentSetupSetBundlerDocument)
const setLanguageMutation = useMutation(EnvironmentSetupSetCodeLanguageDocument)

const setFEBundler = (bundler: SupportedBundlers) => {
  setBundler.executeMutation({ bundler })
}

const setFEFramework = (framework: FrontendFrameworkEnum) => {
  setFramework.executeMutation({ framework })
}

const setLanguage = (language: CodeLanguageEnum) => {
  setLanguageMutation.executeMutation({ language })
}

const { t } = useI18n()

const bundlers = computed(() => {
  const _bundlers = props.gql.framework?.supportedBundlers ?? props.gql.allBundlers

  return _bundlers.map((b) => {
    return {
      disabled: _bundlers.length <= 1,
      ...b,
    }
  })
})
const frameworks = computed(() => {
  return sortBy((props.gql.frameworks ?? []).map((f) => ({ ...f })), 'category')
})

const languages = computed(() => props.gql.allLanguages ?? [])
</script>
