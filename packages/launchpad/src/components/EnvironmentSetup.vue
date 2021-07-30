<template>
  <WizardLayout>
    <div class="m-5">
      <Select
        name="Front-end Framework"
        @select="select"
        :value="selected"
        :options="frameworks"
        placeholder="Pick a framework"
      />

      <div>
        You chose: {{ selected }}.
      </div>
      <!-- <Select
        name="Bundler"
        :disabled="disabledBundlerSelect"
        @select="setFEBundler"
        :options="bundlers"
        :value="selectedBundlerId"
        placeholder="Pick a bundler"
      /> -->
    </div>
  </WizardLayout>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import WizardLayout from "./WizardLayout.vue";
import Select, { Option } from "./Select.vue";
import { gql, useMutation, useQuery } from "@urql/vue";
import { EnvironmentSetupDocument, FrontendFramework, SetFrameworkDocument } from "../generated/graphql";

gql`
query EnvironmentSetup {
  wizard {
    frameworks {
      name
      isSelected
    }
  }
}
`

gql`
mutation SetFramework($framework: FrontendFramework!) {
  wizardSetFramework(framework: $framework) {
    frameworks{
      name
      isSelected
    }
  }
}
`

export default defineComponent({
  components: { WizardLayout, Select },
  props: {
    detectedFramework: {
      type: String,
      default: "none",
    },
    detectedBundler: {
      type: String,
      default: "none",
    },
  },
  setup(props) {
    const wizard = useQuery({ query: EnvironmentSetupDocument })

    const frameworks = computed(() => {
      return wizard.data?.value?.wizard?.frameworks?.map<Option & { isSelected: boolean }>(x => ({
        name: x!.name!,
        id: x!.name!,
        isSelected: x?.isSelected ?? false
      })) || []
    })

    const selected = computed(() => {
      return frameworks.value.find(x => x.isSelected)?.id
    })

    const setFramework = useMutation(SetFrameworkDocument)

    return {
      selected,
      wizard,
      select: (framework: Option) => {
        // @ts-ignore todo: type this
        setFramework.executeMutation({ framework: framework.id as FrontendFramework })
      },
      frameworks,
      // setFEFramework,
      // setFEBundler,
      // selectedFrameworkId,
      // bundlers,
      // selectedBundlerId,
      // disabledBundlerSelect,
    };
  },
});
</script>
