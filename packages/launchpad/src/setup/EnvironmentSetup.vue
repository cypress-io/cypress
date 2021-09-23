<template>
  <WizardLayout :canNavigateForward="props.gql.canNavigateForward">
    <div class="m-5">
      <SelectFramework
        :name="t('setupPage.projectSetup.frameworkLabel')"
        @select="setFEFramework"
        :options="frameworks ?? []"
        :value="props.gql.framework?.id ?? undefined"
        :placeholder="t('setupPage.projectSetup.frameworkPlaceholder')"
      />
      <SelectFramework
        :name="t('setupPage.projectSetup.bundlerLabel')"
        :disabled="bundlers.length === 1"
        @select="setFEBundler"
        :options="bundlers || []"
        :value="props.gql.bundler?.id ?? undefined"
        :placeholder="t('setupPage.projectSetup.bundlerPlaceholder')"
      />
    </div>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import WizardLayout from "./WizardLayout.vue";
import SelectFramework from "../components/select/SelectFramework.vue";
import { gql } from '@urql/core'
import { EnvironmentSetupFragment, EnvironmentSetupSetFrameworkDocument, EnvironmentSetupSetBundlerDocument, FrontendFramework, SupportedBundlers } from '../generated/graphql'
import { useMutation } from '@urql/vue'
import { useI18n } from "../composables";

gql`
mutation EnvironmentSetupSetFramework($framework: FrontendFramework!) {
  wizardSetFramework(framework: $framework) {
    ...EnvironmentSetup
  }
}
`

gql`
mutation EnvironmentSetupSetBundler($bundler: SupportedBundlers!) {
  wizardSetBundler(bundler: $bundler) {
    ...EnvironmentSetup
  }
}
`

gql`
fragment EnvironmentSetup on Wizard {
  canNavigateForward
  bundler {
    id
    name
  }
  framework {
    id
    name
    supportedBundlers {
      id
      name
    }
  }
  frameworks {
    id
    name
    isSelected
  }
  allBundlers {
    id
    name
  }

  ...InstallDependencies
  ...SampleCode
}
`

const props = defineProps<{
  gql: EnvironmentSetupFragment
}>()

const setFramework = useMutation(EnvironmentSetupSetFrameworkDocument)
const setBundler = useMutation(EnvironmentSetupSetBundlerDocument)

const setFEBundler = (bundler: SupportedBundlers) => {
  setBundler.executeMutation({ bundler })
};

const setFEFramework = (framework: FrontendFramework) => {
  setFramework.executeMutation({ framework })
};

const { t } = useI18n()

const bundlers = computed(() => props.gql.framework?.supportedBundlers ?? props.gql.allBundlers)
const frameworks = computed(() => props.gql.frameworks ?? [])
</script>
