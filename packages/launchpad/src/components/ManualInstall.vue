<template>
  <div
    class="
      bg-gray-50
      h-9
      flex
      items-center
      px-5
      gap-2
      border-b border-gray-200
      rounded-t-md
    "
  >
    <div
      :key="i"
      v-for="i in [0, 1, 2]"
      class="rounded-md h-3 w-3 border border-1-gray-600"
    />
  </div>
  <div class="relative">
    <pre class="text-left text-gray-500 p-5"><span 
    class="text-purple-500"
    >{{ projectTitle }}:~$</span> {{ dependenciesCode }}</pre>
    <CopyButton :text="dependenciesCode" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import CopyButton from "./CopyButton.vue";
import { gql } from '@urql/core'
import { ManualInstallFragment } from "../generated/graphql";

gql`
fragment ManualInstall on Wizard {
  packagesToInstall {
    name
    description
  }
}
`

export default defineComponent({
  props: {
    gql: {
      type: Object as PropType<ManualInstallFragment>,
      required: true
    }
  },
  setup(props) {
    const dependenciesCode = computed(
      () =>
        "yarn add -D \\\n" +
        (props.gql.packagesToInstall ?? [])
          .map((pack) => `                    ${pack.name} \\`)
          .join("\n")
    );
    return {
      dependenciesCode,
      projectTitle: 'TODO: project title in gql',
    };
  },
  components: { CopyButton },
});
</script>
