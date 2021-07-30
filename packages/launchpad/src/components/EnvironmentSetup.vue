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
        :options="bundlers || []"
        :value="gql.bundler?.id ?? undefined"
        placeholder="Pick a bundler"
      />
    </div>
  </WizardLayout>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed } from "vue";
import WizardLayout from "./WizardLayout.vue";
import Select, { Option } from "./Select.vue";
import { gql } from '@urql/core'
import { EnvironmentSetupFragment, EnvironmentSetupSetFrameworkDocument, EnvironmentSetupSetBundlerDocument, FrontendFramework, SupportedBundlers } from '../generated/graphql'
import { useMutation } from '@urql/vue'

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

    // const bundlers = useResult(result, null, data => {
    //   const vals = data?.wizard?.framework?.supportedBundlers 
    //     || data?.wizard?.allBundlers
    //     || [] 

    //   return vals.map<Option>(x => ({
    //     name: x!.name,
    //     id: x!.id!,
    //     logo: './404.png',
    //     description: 'TODO: add description gql server'
    //   }))
    // })

    // const frameworks = useResult(result, null, data => data?.wizard?.frameworks?.map<Option>(x => {
    //   return {
    //     name: x!.name,
    //     id: x!.id!,
    //     logo: './404.png',
    //     description: 'TODO: add to gql server'
    //   }
    // }))

    return {
      bundlers: computed(() => props.gql.allBundlers),
      frameworks: computed(() => props.gql.frameworks),
      // lachlan - is this needed??
      gql: computed(() => props.gql),
      setFEFramework,
      setFEBundler,
      disabledBundlerSelect,
    };
  },
});
</script>
