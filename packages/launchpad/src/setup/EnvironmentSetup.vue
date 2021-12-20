<template>
  <WizardLayout
    :back-fn="onBack"
    :next-fn="onNext"
    :can-navigate-forward="canNavigateForward"
    class="max-w-640px"
  >
    <div class="m-24px">
      <SelectFwOrBundler
        :options="frameworks || []"
        :value="props.gql.framework?.type ?? undefined"
        :placeholder="t('setupPage.projectSetup.frameworkPlaceholder')"
        :label="t('setupPage.projectSetup.frameworkLabel')"
        selector-type="framework"
        data-testid="select-framework"
        @select-framework="val => emit('wizardSetup', 'framework', val)"
      />
      <SelectFwOrBundler
        v-if="props.gql.framework?.type && (!props.gql.bundler || bundlers.length > 1)"
        class="pt-3px"
        :options="bundlers || []"
        :value="props.gql.bundler?.type ?? undefined"
        :placeholder="t('setupPage.projectSetup.bundlerPlaceholder')"
        :label="t('setupPage.projectSetup.bundlerLabel')"
        selector-type="bundler"
        data-testid="select-bundler"
        @select-bundler="val => emit('wizardSetup', 'bundler', val)"
      />
      <SelectLanguage
        :name="t('setupPage.projectSetup.languageLabel')"
        :options="languages || []"
        :value="props.gql.language?.id ?? 'js'"
        @select="val => emit('wizardSetup', 'codeLanguage', val)"
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
import type { EnvironmentSetupFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { sortBy } from 'lodash'
import type { CurrentStep, WizardSetupData } from './Wizard.vue'

const emit = defineEmits<{
  (event: 'navigate', toPage: CurrentStep): void
  <K extends keyof WizardSetupData>(event: 'wizardSetup', key: K, val: WizardSetupData[K]): void
}>()

gql`
fragment EnvironmentSetup on Wizard {
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
  data: WizardSetupData
}>()

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

const onNext = () => {
  emit('navigate', 'installDependencies')
}

const onBack = () => {
  // Clear current testing type
}

const languages = computed(() => props.gql.allLanguages ?? [])

const canNavigateForward = computed(() => Object.values(props.data).filter((f) => f).length === 3)
</script>
