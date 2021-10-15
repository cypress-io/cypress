<template>
  <WizardLayout
    :next="nextButtonName"
    :alt="t('setupPage.configFile.createManually')"
    :alt-fn="altFn"
    :next-fn="createConfig"
    :can-navigate-forward="props.gql.wizard.canNavigateForward"
  >
    <div
      v-if="tsInstalled"
      class="relative p-4"
    >
      <ShikiHighlight
        :key="language"
        :lang="language || 'js'"
        :code="code || ''"
      />
      <CopyButton
        v-if="manualCreate && code"
        :text="code"
      />
    </div>
  </WizardLayout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import 'prismjs'
import '@packages/frontend-shared/src/styles/prism.scss'
import { gql } from '@urql/core'
import PrismJs from 'vue-prism-component'
import WizardLayout from './WizardLayout.vue'
import CopyButton from '@cy/components/CopyButton.vue'
import { ConfigFileFragment, ConfigFile_AppCreateConfigFileDocument, ConfigFile_AppCreateComponentIndexHtmlDocument } from '../generated/graphql'
import { useMutation } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import ShikiHighlight from '@cy/components/ShikiHighlight.vue'

const { t } = useI18n()

gql`
fragment ConfigFile on Query {
  app {
    activeProject {
      id
      projectRoot
    }
  }
  wizard {
    ...SampleCode
  }
}
`

gql`
fragment SampleCode on Wizard {
  language {
    type
  }
  canNavigateForward
  sampleCode
  sampleTemplate
}
`

gql`
mutation ConfigFile_appCreateConfigFile($code: String!, $configFilename: String!) {
  appCreateConfigFile(code: $code, configFilename: $configFilename) {
    activeProject {
      id
      projectRoot
    }
  }
}
`

gql`
mutation ConfigFile_appCreateComponentIndexHtml($template: String!) {
  appCreateComponentIndexHtml(template: $template) {
    activeProject {
      id
      projectRoot
    }
  }
}
`

const props = defineProps<{
  gql: ConfigFileFragment
}>()

const manualCreate = ref(false)

const altFn = (val: boolean) => {
  manualCreate.value = val
}

const tsInstalled = ref(false)
const language = computed(() => {
  return props.gql.wizard.language?.type
})
const nextButtonName = computed(() => {
  return manualCreate.value ? 'I\'ve added this file' : 'Create File'
})

import('prismjs/components/prism-typescript').then(() => {
  tsInstalled.value = true
})

const createConfigFile = useMutation(ConfigFile_AppCreateConfigFileDocument)
const createComponentIndexHtml = useMutation(ConfigFile_AppCreateComponentIndexHtmlDocument)

const code = computed(() => {
  return props.gql.wizard.sampleCode
})

const createConfig = async () => {
  if (manualCreate.value) {
    return
  }

  if (!props.gql.app?.activeProject?.projectRoot) {
    throw Error(`Cannot find the active project's projectRoot. This should never happen.`)
  }

  if (!code.value) {
    // should be impossible
    throw Error(`Code is required to create a config file. Got ${code.value}.`)
  }

  await createConfigFile.executeMutation({
    code: code.value,
    configFilename: `cypress.config.${language.value}`,
  })

  await createComponentIndexHtml.executeMutation({
    template: props.gql.wizard.sampleTemplate as string,
  })
}
</script>

<style>
body pre[class*="language-"] {
  margin: 0 5px;
}
</style>
