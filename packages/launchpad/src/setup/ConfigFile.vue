<template>
  <WizardLayout 
    :next="nextButtonName" 
    alt="Create file manually" 
    :altFn="altFn"
    :nextFn="createConfig"
    :canNavigateForward="wizard.canNavigateForward"
  >
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

<script lang="ts" setup>
import { computed, ref } from "vue";
import "prismjs";
import "@packages/reporter/src/errors/prism.scss";
import { gql } from '@urql/core'
import PrismJs from "vue-prism-component";
import WizardLayout from "./WizardLayout.vue";
import CopyButton from "../components/button/CopyButton.vue";
import { languages } from "../utils/configFile";
import { ConfigFileFragment, ProjectRootFragment, AppCreateConfigFileDocument } from "../generated/graphql";
import { useMutation } from "@urql/vue";

gql`
fragment ConfigFile on Wizard {
  canNavigateForward
  sampleCodeJs: sampleCode(lang: js)
  sampleCodeTs: sampleCode(lang: ts)
}
`

gql`
fragment ProjectRoot on App {
  activeProject {
    projectRoot
  }
}
`

gql`
mutation appCreateConfigFile($code: String!, $configFilename: String!) {
  appCreateConfigFile(code: $code, configFilename: $configFilename) {
    activeProject {
      projectRoot
    }
  }
}
`

const props = defineProps<{
  wizard: ConfigFileFragment 
  app: ProjectRootFragment
}>()


const manualInstall = ref(false);

const altFn = (val: boolean) => {
  manualInstall.value = val
}

const tsInstalled = ref(false);
const language = ref<"js" | "ts">("ts");
const nextButtonName = computed(() =>
  manualInstall.value ? "I've added this file" : "Create File"
);

import("prismjs/components/prism-typescript").then(() => {
  tsInstalled.value = true;
});


const createConfigFile = useMutation(AppCreateConfigFileDocument)

const code = computed(() => {
  if (language.value === 'js') {
    return props.wizard.sampleCodeJs
  }
  return props.wizard.sampleCodeTs
})

const createConfig = async () => {
  if (!props.app?.activeProject?.projectRoot) {
    throw Error(`Cannot find the active project's projectRoot. This should never happen.`)
  }

  if (!code.value) {
    // should be impossible 
    throw Error(`Code is required to create a config file. Got ${code.value}.`)
  }

  await createConfigFile.executeMutation({ 
    code: code.value,
    configFilename: `cypress.config.${language.value}`
  })
}
</script>

<style>
body pre[class*="language-"] {
  margin: 0 5px;
}
</style>
