<template>
  <Alert
    v-if="shouldRenderAlert"
    v-model="isAlertOpen"
    :icon="ErrorOutlineIcon"
    class="mx-auto my-[24px] max-w-[640px]"
    status="warning"
    :title="t('setupPage.projectSetup.communityFrameworkDefinitionProblem')"
    dismissible
  >
    <p>
      {{ t('setupPage.projectSetup.communityDependenciesCouldNotBeParsed', erroredFrameworks.length) }}
    </p>
    <ul class="list-disc my-[12px] ml-[36px]">
      <li
        v-for="framework in erroredFrameworks"
        :key="framework.path as string"
      >
        <ExternalLink
          data-cy="errored-framework-path"
          :href="`file://${framework.path}`"
        >
          {{ framework.path }}
        </ExternalLink>
      </li>
    </ul>
    <i18n-t
      tag="p"
      keypath="setupPage.projectSetup.seeFrameworkDefinitionDocumentation"
    >
      <ExternalLink
        :href="getUrlWithParams({
          url :'https://on.cypress.io/component-integrations',
          params: {
            utm_medium: 'Framework Definition Warning'
          }
        })"
      >
        {{ t('setupPage.projectSetup.frameworkDefinitionDocumentation') }}
      </ExternalLink>
    </i18n-t>
  </Alert>
  <WizardLayout
    :back-fn="onBack"
    :next-fn="props.nextFn"
    :can-navigate-forward="canNavigateForward"
    class="max-w-[640px]"
  >
    <div class="m-[24px]">
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
        class="pt-[3px]"
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
  EnvironmentSetup_DetectionChangeDocument,
} from '../generated/graphql'

import { useI18n } from '@cy/i18n'
import { useMutation, useSubscription } from '@urql/vue'
import type { FrameworkOption } from './types'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'

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
  erroredFrameworks {
    id
    path
  }
}
`

gql`
subscription EnvironmentSetup_DetectionChange {
  frameworkDetectionChange {
    ...EnvironmentSetup
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

const erroredFrameworks = computed(() => {
  return props.gql.erroredFrameworks.filter((framework) => framework.path)
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

useSubscription({ query: EnvironmentSetup_DetectionChangeDocument })

const isAlertOpen = ref(true)
const shouldRenderAlert = computed(() => erroredFrameworks.value.length > 0)
</script>
