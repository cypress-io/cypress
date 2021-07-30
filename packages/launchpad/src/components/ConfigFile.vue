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
    <h1>TODO: PrismJS seems not working</h1>
    {{ code }}
    <div v-if="tsInstalled" class="relative">
      <!-- <PrismJs :key="language" :language="language">{{ code }}</PrismJs> -->
      <CopyButton v-if="manualInstall" :text="code" />
    </div>
  </WizardLayout>
</template>

<script lang="ts">
import { watch, computed, defineComponent, onMounted, ref } from "vue";
import "prismjs";
import "@packages/reporter/src/errors/prism.scss";
import { gql } from '@urql/core'
import { useQuery } from "@urql/vue";
import PrismJs from "vue-prism-component";
import WizardLayout from "./WizardLayout.vue";
import CopyButton from "./CopyButton.vue";
import { getCode, languages } from "../utils/configFile";
import { WizardDevServerConfigDocument } from "../generated/graphql";

gql`
query wizardDevServerConfig {
  wizard {
    configFile {
      ts
      js
    }
  }
}
`

export default defineComponent({
  components: {
    WizardLayout,
    PrismJs,
    CopyButton,
  },
  setup() {
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

    const { data } = useQuery({
      query: WizardDevServerConfigDocument
    })

    watch(language, v => {
      console.log(data.value?.wizard?.configFile.js)
    })

    const code = computed(() => {
      return data.value?.wizard?.configFile[language.value] || ''
    })

    return {
      manualInstall,
      altFn,
      nextButtonName,
      code,
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
