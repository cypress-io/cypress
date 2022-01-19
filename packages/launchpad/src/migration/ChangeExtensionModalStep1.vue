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
    <MigrationTitle
      :title="t('migration.renameAuto.title')"
      class="mt-24px"
    />
    <MigrationList>
      <template #line-1>
        {{ t('migration.renameAuto.modals.step1.line1') }}
      </template>
      <template #line-2>
        {{ t('migration.renameAuto.modals.step1.line2') }}
        <CodeTag class="text-jade-500">
          [filename].cy.[ext]
        </CodeTag>
      </template>
      <template #line-3>
        {{ t('migration.renameAuto.modals.step1.line3') }}
      </template>
      <template #line-4>
        {{ t('migration.renameAuto.modals.step1.line4') }}
      </template>
      <template #line-5>
        <i18n-t keypath="migration.renameAuto.modals.step1.line5">
          <CodeTag class="text-jade-500">
            [filename].cy.[ext]
          </CodeTag>
        </i18n-t>
      </template>
    </MigrationList>
    <template #footer>
      <div class="flex gap-16px">
        <Button
          :suffix-icon="ArrowRightIcon"
          suffix-icon-class="w-16px h-16px icon-dark-white"
          @click="emit('proceed')"
        >
          {{ t('migration.renameAuto.modals.step1.buttonProceed') }}
        </Button>
        <Button
          variant="outline"
          @click="emit('cancel')"
        >
          {{ t('migration.renameAuto.modals.step1.buttonCancel') }}
        </Button>
      </div>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import Alert from '@cy/components/Alert.vue'
import Button from '@cy/components/Button.vue'
import CodeTag from '@cy/components/CodeTag.vue'
import StandardModal from '@cy/components/StandardModal.vue'
import ArrowRightIcon from '~icons/cy/arrow-right_x16.svg'
import MigrationList from './fragments/MigrationList.vue'
import MigrationTitle from './fragments/MigrationTitle.vue'
import { useMarkdown } from '@packages/frontend-shared/src/composables/useMarkdown'
import { useI18n } from '@cy/i18n'
import { ref } from 'vue'

const { t } = useI18n()

const warningRef = ref()

const { markdown: markdownWarning } = useMarkdown(warningRef, t('migration.renameAuto.modals.step1.warning'))

const emit = defineEmits([
  'proceed',
  'cancel',
])

</script>
