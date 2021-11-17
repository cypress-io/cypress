<template>
  <StandardModal
    class="transition duration-200 transition-all w-680px"
    variant="bare"
    :title="title"
    :model-value="show"
    @update:model-value="emits('close')"
  >
    <div class="p-24px text-gray-700">
      <p class="mb-16px">
        <i18n-t
          keypath="topNav.updateCypress.currentlyRunning"
        >
          {{ installedVersion }}
        </i18n-t>
      </p>
      <p class="mb-16px">
        {{ t('topNav.updateCypress.pasteToUpgrade') }}
      </p>
      <TerminalPrompt
        :command="installCommand + 'cypress@10.0.0'"
        :project-folder-name="projectName"
      />
      <p
        class="pt-16px"
        v-html="t('topNav.updateCypress.rememberToClose')"
      />
    </div>
  </StandardModal>
</template>

<script setup lang="ts">
import StandardModal from '../../components/StandardModal.vue'
import TerminalPrompt from '../../components/TerminalPrompt.vue'
import InlineCodeFragment from '../../components/InlineCodeFragment.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  installCommand?: string
  installedVersion: string
  latestVersion: string
  projectName?: string
  show: boolean
}>(), {
  installCommand: 'npm install --save-dev ',
  projectName: '', // in global mode, project won't be populated so an empty string is fine
})

const title = `${t('topNav.updateCypress.title')} ${props.latestVersion}`

const emits = defineEmits<{
  (eventName: 'close'): void
}>()

</script>
