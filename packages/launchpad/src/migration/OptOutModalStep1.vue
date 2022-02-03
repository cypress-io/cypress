<template>
  <StandardModal
    :model-value="true"
    :title="t('migration.renameAuto.modals.title')"
  >
    <Alert
      status="warning"
      :title="t('migration.renameAuto.modals.step1.warning')"
      :icon="WarningIcon"
      icon-classes="icon-dark-orange-400"
    />
    <MigrationTitle
      :title="t('migration.renameAuto.title')"
      class="mt-24px"
    />
    <MigrationList>
      <MigrationListItem>
        {{ t('migration.renameAuto.modals.step1.line1') }}
      </MigrationListItem>
      <MigrationListItem>
        {{ t('migration.renameAuto.modals.step1.line2') }}
        <CodeTag class="text-jade-500">
          [filename].cy.[ext]
        </CodeTag>
      </MigrationListItem>
      <MigrationListItem>
        {{ t('migration.renameAuto.modals.step1.line3') }}
      </MigrationListItem>
      <MigrationListItem>
        {{ t('migration.renameAuto.modals.step1.line4') }}
      </MigrationListItem>
      <MigrationListItem>
        <i18n-t
          scope="global"
          keypath="migration.renameAuto.modals.step1.line5"
        >
          <CodeTag class="text-jade-500">
            [filename].cy.[ext]
          </CodeTag>
        </i18n-t>
      </MigrationListItem>
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
import WarningIcon from '~icons/cy/warning_x16.svg'
import MigrationList from './fragments/MigrationList.vue'
import MigrationTitle from './fragments/MigrationTitle.vue'
import MigrationListItem from './fragments/MigrationListItem.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const emit = defineEmits([
  'proceed',
  'cancel',
])

</script>
