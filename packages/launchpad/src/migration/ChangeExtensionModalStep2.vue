<template>
  <StandardModal
    :model-value="true"
    :title="t('migration.renameAuto.modals.title')"
  >
    <Alert status="warning">
      <p
        ref="warningRef"
        v-html="markdownWarning"
      />
    </Alert>
    <template #footer>
      <div class="flex gap-16px">
        <Button
          @click="emit('save')"
        >
          {{ t('migration.renameAuto.modals.step2.buttonSave') }}
        </Button>
        <Button
          variant="outline"
          @click="emit('cancel')"
        >
          {{ t('migration.renameAuto.modals.step2.buttonCancel') }}
        </Button>
      </div>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Alert from '@cy/components/Alert.vue'
import Button from '@cy/components/Button.vue'
import CodeTag from '@cy/components/CodeTag.vue'
import StandardModal from '@cy/components/StandardModal.vue'
import { useMarkdown } from '@packages/frontend-shared/src/composables/useMarkdown'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const warningRef = ref()

const { markdown: markdownWarning } = useMarkdown(warningRef, t('migration.renameAuto.modals.step2.warning'))

const emit = defineEmits([
  'save',
  'cancel',
])

</script>
