<template>
  <WizardLayout :next="nextButtonName" alt="Create file manually" :altFn="altFn">
    <nav
      class="
        rounded-t
        text-left text-gray-500
        px-5
        bg-gray-50
        flex
        gap-2
        border-b-1 border-gray-200
      "
    >
      <button
        v-for="lang of languages"
        :key="lang.id"
        @click="language = lang.id"
        class="p-4 w-28 relative focus:outline-transparent"
        :class="language === lang.id ? 'text-indigo-600 font-semibold' : ''"
      >
        {{ lang.name }}
        <span
          v-if="language === lang.id"
          class="
            absolute
            bottom-0
            left-0
            right-0
            block
            h-1
            bg-indigo-500
            rounded-t
          "
        />
      </button>
    </nav>
    <div v-if="tsInstalled" class="relative">
      <PrismJs :key="language" :language="language">{{ code }}</PrismJs>
      <CopyButton v-if="manualInstall && code" :text="code" />
    </div>
  </WizardLayout>
</template>

<script lang="ts">
import { computed, defineComponent, ref, PropType } from "vue";
import "prismjs";
import "@packages/reporter/src/errors/prism.scss";
import { gql } from '@urql/core'
import PrismJs from "vue-prism-component";
import WizardLayout from "./WizardLayout.vue";
import CopyButton from "./CopyButton.vue";
import { languages } from "../utils/configFile";
import type { ConfigFileFragment } from "../generated/graphql";

gql`
fragment ConfigFile on Wizard {
  sampleCodeJs: sampleCode(lang: js)
  sampleCodeTs: sampleCode(lang: ts)
}
`

export default defineComponent({
  components: {
    WizardLayout,
    PrismJs,
    CopyButton,
  },
  props: {
    gql: {
      type: Object as PropType<ConfigFileFragment>,
      required: true
    }
  },
  setup(props) {
    const manualInstall = ref(false);

    const altFn = (val: boolean) => {
      manualInstall.value = val
    }

    const tsInstalled = ref(false);
    const language = ref<"js" | "ts">("ts");
    const nextButtonName = computed(() =>
      manualInstall.value ? "I've added this file" : "Create File"
    );

    const originalText = {
      title: "Cypress.config",
      description:
        "Cypress will now create the following config file in the local directory for this project.",
    }
    const manualText = {
      title: "Cypress.config",
      description:
        "Create a <em>cypress.config.js</em> file with the code below to store your project configuration.",
    }

    import("prismjs/components/prism-typescript").then(() => {
      tsInstalled.value = true;
    });

    return {
      manualInstall,
      altFn,
      nextButtonName,
      code: computed(() => {
        if (language.value === 'js') {
          return props.gql.sampleCodeJs
        }
        return props.gql.sampleCodeTs
      }),
      language,
      languages,
      tsInstalled,
    };
  },
});
</script>

<style>
body pre[class*="language-"] {
  margin: 0 5px;
}
</style>
