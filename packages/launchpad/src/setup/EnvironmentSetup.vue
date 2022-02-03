<template>
  <WizardLayout
    :back-fn="onBack"
    :next-fn="props.nextFn"
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
        @select-framework="val => onWizardSetup('framework', val)"
      />
      <SelectFwOrBundler
        v-if="props.gql.framework?.type && bundlers.length > 1"
        class="pt-3px"
        :options="bundlers || []"
        :value="props.gql.bundler?.type ?? undefined"
        :placeholder="t('setupPage.projectSetup.bundlerPlaceholder')"
        :label="t('setupPage.projectSetup.bundlerLabel')"
        selector-type="bundler"
        data-testid="select-bundler"
        @select-bundler="val => onWizardSetup('bundler', val)"
      />
      <SelectLanguage
        :name="t('setupPage.projectSetup.languageLabel')"
        :options="languages || []"
        :value="props.gql.language?.type ?? 'js'"
        @select="val => onWizardSetup('codeLanguage', val)"
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
  WizardUpdateInput,
  EnvironmentSetupFragment,
  EnvironmentSetup_ClearTestingTypeDocument,
  EnvironmentSetup_WizardUpdateDocument,
} from '../generated/graphql'
import { useI18n } from '@cy/i18n'
import { sortBy } from 'lodash'
import { useMutation } from '@urql/vue'

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
  nextFn: () => void,
}>()

const { t } = useI18n()

const bundlers = computed(() => {
  const _bundlers = props.gql.framework?.supportedBundlers || []

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

gql`
mutation EnvironmentSetup_wizardUpdate($input: WizardUpdateInput!) {
  wizardUpdate(input: $input) {
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
}
`

const wizardUpdateMutation = useMutation(EnvironmentSetup_WizardUpdateDocument)

const onWizardSetup = <K extends keyof WizardUpdateInput>(key: K, val: WizardUpdateInput[K]) => {
  const input = {} as unknown as WizardUpdateInput

  input[key] = val

  wizardUpdateMutation.executeMutation({
    input,
  })
}

gql`
mutation EnvironmentSetup_ClearTestingType {
  clearCurrentTestingType {
    currentTestingType
    currentProject {
      id
      currentTestingType
    }
  }
}
`

const clearTestingTypeMutation = useMutation(EnvironmentSetup_ClearTestingTypeDocument)

const onBack = () => {
  clearTestingTypeMutation.executeMutation({})
}

const languages = computed(() => props.gql.allLanguages ?? [])

const canNavigateForward = computed(() => {
  const { bundler, framework, language } = props.gql

  return bundler !== null && framework !== null && language !== null
})

</script>
