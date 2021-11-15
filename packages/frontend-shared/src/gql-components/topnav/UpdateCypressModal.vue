<template>
  <StandardModal
    class="transition duration-200 transition-all w-480px"
    :click-outside="false"
    variant="bare"
    :title="title"
    :model-value="true"
  >
    <div class="p-24px text-gray-700">
      <p class="mb-16px">
        You are currently running Version {{ installedVersion }} of Cypress.
      </p>
      <p class="mb-16px">
        Paste the command below into your terminal to upgrade to the latest version of Cypress for this project.*
      </p>
      <TerminalPrompt
        :command="installCommand + 'cypress@10.0.0'"
        :project-folder-name="'test-proj'"
      />

      <p class="py-16px">
        *Remember to <span class="font-bold">close this app</span> before installing.
      </p>
      <p>
        <!-- eslint-disable-next-line vue/singleline-html-element-content-newline -->
        Run <InlineCodeFragment class="text-14px"> node_modules/.bin/cypress open</InlineCodeFragment>
        to open the new version.
      </p>
    </div>
  </StandardModal>
</template>

<script setup lang="ts">
import StandardModal from '../../components/StandardModal.vue'
import TerminalPrompt from '../../components/TerminalPrompt.vue'
import InlineCodeFragment from '../../components/InlineCodeFragment.vue'

const props = withDefaults(defineProps<{
  installCommand?: string
  installedVersion: string
  latestVersion: string
}>(), {
  installCommand: 'npm install --save-dev ',
})

const title = `Upgrade to Cypress ${props.latestVersion}`

</script>
