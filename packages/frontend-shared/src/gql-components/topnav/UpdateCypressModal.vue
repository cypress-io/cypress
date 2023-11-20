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
        <i18n-t
          scope="global"
          keypath="topNav.updateCypress.currentlyRunning"
        >
          {{ installedVersion }}
        </i18n-t>
        <i18n-t
          scope="global"
          :keypath="props.projectName ? 'topNav.updateCypress.pasteToUpgradeProject' : 'topNav.updateCypress.pasteToUpgradeGlobal'"
        >
          <span class="font-bold">{{ t('topNav.updateCypress.rememberToCloseInsert') }}</span>
        </i18n-t>
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
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  installCommand: string
  installedVersion: string
  latestVersion: string
  projectName?: string
  show: boolean
}>(), {
  projectName: '', // in global mode, project won't be populated so an empty string is fine
})

const title = `${t('topNav.updateCypress.title')} ${props.latestVersion}`

const emits = defineEmits<{
  (eventName: 'close'): void
}>()

</script>
