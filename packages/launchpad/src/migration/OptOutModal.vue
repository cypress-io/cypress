<template>
  <StandardModal
    :model-value="true"
    :title="t('migration.renameAuto.modals.title')"
    @update:modelValue="emit('cancel')"
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
        <CodeTag class="text-jade-500">
          [filename].cy.[ext]
        </CodeTag>
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
      <MigrationListItem>
        <i18n-t
          scope="global"
          keypath="migration.renameAuto.modals.step1.line6"
        >
          <CodeTag class="text-jade-500">
            [filename].cy.[ext]
          </CodeTag>
        </i18n-t>
      </MigrationListItem>
    </MigrationList>
    <Radio
      v-model:value="value"
      :options="options"
      name="skipRename"
      :label="t('migration.renameAuto.modals.step2.label')"
    >
      <template #option="{ option }">
        <span
          v-if="option.value === 'rename'"
          class="text-jade-500"
        >
          <i18n-t
            scope="global"
            keypath="migration.renameAuto.modals.step2.option1"
          >
            <CodeTag class="ml-0 text-jade-500">
              [filename].cy.[ext]
            </CodeTag>
          </i18n-t>
        </span>
        <span
          v-else
          class="text-gray-800"
        >
          {{ props.hasCustomIntegrationFolder ? t('migration.renameAuto.modals.step2.option2') : t('migration.renameAuto.modals.step2.option3') }}
        </span>
      </template>
    </Radio>
    <template #footer>
      <div class="flex gap-16px">
        <Button
          @click="emit('save', value)"
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
import Radio from '@cy/components/Radio.vue'
import WarningIcon from '~icons/cy/warning_x16.svg'
import MigrationList from './fragments/MigrationList.vue'
import MigrationTitle from './fragments/MigrationTitle.vue'
import MigrationListItem from './fragments/MigrationListItem.vue'
import { useI18n } from '@cy/i18n'
import type { PossibleOption } from './types'

const { t } = useI18n()

const emit = defineEmits<{
  (event: 'save', option: PossibleOption): void
  (event: 'cancel'): void
}>()

const value = ref<PossibleOption>('rename')

const props = defineProps<{
  hasCustomIntegrationFolder: boolean
}>()

const options: Array<{ label: '', value: PossibleOption }> = [
  {
    label: '',
    value: 'rename',
  },
  {
    label: '',
    value: props.hasCustomIntegrationFolder ? 'skip' : 'renameFolder',
  },
]
</script>
