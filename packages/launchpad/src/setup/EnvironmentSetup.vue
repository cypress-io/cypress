<template>
  <Alert
    v-model="isAlertOpen"
    class="mx-auto my-24px max-w-640px"
    status="warning"
    title="Community Framework Definition Problem"
    dismissible
  >
    <p>
      The following Community Framework Definitions were found in this project's dependencies but could not be parsed by Cypress:
    </p>
    <!-- eslint-disable vue/multiline-html-element-content-newline -->
    <ul class="list-disc my-12px ml-36px">
      <li>
        <ExternalLink href="https://npmjs.org/cypress-ct-qwik">
          cypress-ct-qwik</ExternalLink>
      </li>
      <li>
        <ExternalLink href="https://npmjs.org/cypress-ct-other">
          cypress-ct-other</ExternalLink>
      </li>
    </ul>
    <p>
      See the the <ExternalLink
        :href="getUrlWithParams({
          url :'https://on.cypress.io/component-integrations',
          params: {
            utm_medium: 'Framework Definition Warning'
          }
        })"
      >framework definition documentation</ExternalLink>
      for more information about third party definitions.
    </p>
    <!-- eslint-enable vue/multiline-html-element-content-newline -->
  </Alert>
  <WizardLayout
    :back-fn="onBack"
    :next-fn="props.nextFn"
    :can-navigate-forward="canNavigateForward"
    class="max-w-640px"
  >
    <div class="m-24px">
      <SelectFrameworkOrBundler
        :options="frameworks || []"
        :value="props.gql.framework?.type ?? undefined"
        :placeholder="t('setupPage.projectSetup.frameworkPlaceholder')"
        :label="t('setupPage.projectSetup.frameworkLabel')"
        selector-type="framework"
        data-testid="select-framework"
        @select-framework="val => onWizardSetup('framework', val)"
      />
      <SelectFrameworkOrBundler
        v-if="props.gql.framework?.type && bundlers.length > 1"
        class="pt-3px"
        :options="bundlers"
        :value="props.gql.bundler?.type ?? undefined"
        :placeholder="t('setupPage.projectSetup.bundlerPlaceholder')"
        :label="t('setupPage.projectSetup.bundlerLabel')"
        selector-type="bundler"
        data-testid="select-bundler"
        @select-bundler="val => onWizardSetup('bundler', val)"
      />
    </div>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import WizardLayout from './WizardLayout.vue'
import SelectFrameworkOrBundler from './SelectFrameworkOrBundler.vue'
import Alert from '@cy/components/Alert.vue'
import { gql } from '@urql/core'
import type { WizardUpdateInput, EnvironmentSetupFragment } from '../generated/graphql'
import {
  EnvironmentSetup_ClearTestingTypeDocument,
  EnvironmentSetup_WizardUpdateDocument,
} from '../generated/graphql'

import { useI18n } from '@cy/i18n'
import { useMutation } from '@urql/vue'
import type { FrameworkOption } from './types'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'

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
    icon
  }
  frameworks {
    id
    supportStatus
    name
    isDetected
    type
    category
    icon
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
  const data = (props.gql.frameworks || []).map<FrameworkOption>((x) => {
    return {
      type: x.type,
      supportStatus: x.supportStatus,
      name: x.name,
      id: x.id,
      isDetected: x.isDetected,
      icon: x.icon || undefined,
    }
  })

  data.sort((x, y) => x.name.localeCompare(y.name))

  return data
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

const isAlertOpen = ref(true)
</script>
