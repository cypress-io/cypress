<template>
  <WizardLayout>
    <div class="m-5">
      <Select
        name="Front-end Framework"
        @select="setFEFramework"
        :options="frameworks ?? []"
        :value="gql.framework?.id ?? undefined"
        placeholder="Pick a framework"
      />
      <Select
        name="Bundler"
        :disabled="disabledBundlerSelect"
        @select="setFEBundler"
        :options="gql.framework?.supportedBundlers ?? gql.allBundlers"
        :value="gql.bundler?.id ?? undefined"
        placeholder="Pick a bundler"
      />
    </div>
  </WizardLayout>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import WizardLayout from "./WizardLayout.vue";
import Select, { Option } from "./Select.vue";
import { gql } from '@apollo/client/core'
import { EnvironmentSetupFragment, EnvironmentSetupSetFrameworkDocument, EnvironmentSetupSetBundlerDocument, FrontendFramework, SupportedBundlers, WizardDocument } from '../generated/graphql'
import { useMutation, useQuery, useResult} from '@vue/apollo-composable'

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
      isOnlyOption
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
    isOnlyOption
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
  setup(props) {
    const setFramework = useMutation(EnvironmentSetupSetFrameworkDocument)
    const setBundler = useMutation(EnvironmentSetupSetBundlerDocument)

    const disabledBundlerSelect = ref(false);

    const setFEBundler = (bundler: SupportedBundlers) => {
      setBundler.mutate({ bundler })
    };

    const setFEFramework = (framework: FrontendFramework) => {
      setFramework.mutate({ framework })
    };

    const { result } = useQuery(WizardDocument, {})

    const frameworks = useResult(result, null, data => data?.wizard?.frameworks?.map<Option>(x => {
      return {
        name: x!.name,
        id: x!.id!,
        logo: './404.png',
        description: 'TODO: add to gql server'
      }
    }))

    return {
      frameworks,
      setFEFramework,
      setFEBundler,
      disabledBundlerSelect,
    };
  },
});
</script>
