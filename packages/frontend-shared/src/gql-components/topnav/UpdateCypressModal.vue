<template>
  <StandardModal
    class="transition transition-all w-[680px] duration-200"
    variant="bare"
    :title="title"
    :model-value="show"
    :no-help="true"
    @update:model-value="emits('close')"
  >
    <div class="p-[24px] text-gray-700">
      <p class="mb-[16px]">
        You are currently running Version {{ installedVersion }} of Cypress.
        <template v-if="props.projectName">
          To upgrade to the latest version for your project, first <span class="font-bold">close this app</span>, then paste the command below into your terminal:
        </template>
        <template v-else>
          To upgrade to the latest version, first <span class="font-bold">close this app</span>, then paste the command below into your terminal:
        </template>
      </p>

      <TerminalPrompt
        :command="installCommand + 'cypress@' + latestVersion"
        :project-folder-name="projectName"
      />
    </div>
  </StandardModal>
</template>

<script setup lang="ts">
import StandardModal from '../../components/StandardModal.vue'
import TerminalPrompt from '../../components/TerminalPrompt.vue'
const props = withDefaults(defineProps<{
  installCommand: string
  installedVersion: string
  latestVersion: string
  projectName?: string
  show: boolean
}>(), {
  projectName: '', // in global mode, project won't be populated so an empty string is fine
})

const title = `Upgrade to Cypress ${props.latestVersion}`

const emits = defineEmits<{
  (eventName: 'close'): void
}>()

</script>
