<template>
  <WizardLayout>
    <div class="m-5">
      <Select
        :name="t('launchpad.projectSetup.frameworkLabel')"
        @select="setFEFramework"
        :options="frameworks ?? []"
        :value="gql.framework?.id ?? undefined"
        :placeholder="t('launchpad.projectSetup.frameworkPlaceholder')"
      />
      <Select
        :name="t('launchpad.projectSetup.bundlerLabel')"
        :disabled="bundlers.length === 1"
        @select="setFEBundler"
        :options="bundlers || []"
        :value="gql.bundler?.id ?? undefined"
        :placeholder="t('launchpad.projectSetup.bundlerPlaceholder')"
      />
    </div>
  </WizardLayout>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from "vue";
import WizardLayout from "./WizardLayout.vue";
import Select from "../components/Select/Select.vue";
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
}
`

export default defineComponent({
  components: { WizardLayout, Select },
  props: {
    gql: {
      type: Object as PropType<EnvironmentSetupFragment>,
      required: true
    }
  },
  setup (props) {
    const setFramework = useMutation(EnvironmentSetupSetFrameworkDocument)
    const setBundler = useMutation(EnvironmentSetupSetBundlerDocument)

    const disabledBundlerSelect = ref(false);

    const setFEBundler = (bundler: SupportedBundlers) => {
      setBundler.executeMutation({ bundler })
    };

    const setFEFramework = (framework: FrontendFramework) => {
      setFramework.executeMutation({ framework })
    };

    const { t } = useI18n()

    return {
      bundlers: computed(() => props.gql.framework?.supportedBundlers ?? props.gql.allBundlers),
      frameworks: computed(() => props.gql.frameworks ?? []),
      gql: computed(() => props.gql),
      setFEFramework,
      setFEBundler,
      disabledBundlerSelect,
      t
    };
  },
});
</script>
