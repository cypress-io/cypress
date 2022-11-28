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
        :options="bundlers"
        :value="props.gql.bundler?.type ?? undefined"
        :placeholder="t('setupPage.projectSetup.bundlerPlaceholder')"
        :label="t('setupPage.projectSetup.bundlerLabel')"
        :description="t('setupPage.projectSetup.bundlerLabelDescription')"
        selector-type="bundler"
        data-testid="select-bundler"
        @select-bundler="val => onWizardSetup('bundler', val)"
      />
    </div>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import WizardLayout from './WizardLayout.vue'
import SelectFwOrBundler from './SelectFwOrBundler.vue'
import { gql } from '@urql/core'
import type { WizardUpdateInput, EnvironmentSetupFragment } from '../generated/graphql'
import {
  EnvironmentSetup_ClearTestingTypeDocument,
  EnvironmentSetup_WizardUpdateDocument,
} from '../generated/graphql'

import { useI18n } from '@cy/i18n'
import { useMutation } from '@urql/vue'

gql`
fragment EnvironmentSetup on Wizard {
  bundler {
    id
    name
    type
    isDetected
  }
  framework {
    type
    id
    name
    isDetected
    supportedBundlers {
      id
      type
      name
      isDetected
    }
    category
  }
  frameworks {
    id
    supportStatus
    name
    isDetected
    type
    category
  }
  allBundlers {
    id
    name
    type
    isDetected
  }
}
`

const props = defineProps<{
  gql: EnvironmentSetupFragment
  nextFn: () => void
}>()

const { t } = useI18n()

const bundlers = computed(() => {
  const all = props.gql.framework?.supportedBundlers || []

  return all.map((b) => ({ disabled: all.length <= 1, ...b })).sort((x, y) => x.name.localeCompare(y.name))
})

const frameworks = computed(() => {
  return (props.gql.frameworks || []).map((x) => ({ ...x })).sort((x, y) => x.name.localeCompare(y.name))
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

const canNavigateForward = computed(() => {
  const { bundler, framework } = props.gql

  return bundler !== null && framework !== null
})

</script>
