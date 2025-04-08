<template>
  <StandardModal
    :model-value="true"
    :title="t('migration.renameAuto.modal.title')"
    :no-help="true"
    @update:modelValue="emit('cancel')"
  >
    <Alert
      status="warning"
      :title="t('migration.renameAuto.modal.warning')"
      :icon="WarningIcon"
      icon-classes="icon-dark-orange-400"
    />
    <MigrationTitle
      :title="t('migration.renameAuto.title')"
      class="mt-[24px]"
    />
    <MigrationList>
      <MigrationListItem>
        {{ t('migration.renameAuto.modal.line1') }}
      </MigrationListItem>
      <MigrationListItem>
        {{ t('migration.renameAuto.modal.line2') }}
        <CodeTag class="text-jade-500">
          [filename].cy.[ext]
        </CodeTag>
      </MigrationListItem>
      <MigrationListItem>
        {{ t('migration.renameAuto.modal.line3') }}
      </MigrationListItem>
      <MigrationListItem>
        {{ t('migration.renameAuto.modal.line4') }}
        <CodeTag class="text-jade-500">
          [filename].cy.[ext]
        </CodeTag>
      </MigrationListItem>
      <MigrationListItem>
        <i18n-t
          scope="global"
          keypath="migration.renameAuto.modal.line5"
        >
          <CodeTag class="text-jade-500">
            [filename].cy.[ext]
          </CodeTag>
        </i18n-t>
      </MigrationListItem>
      <MigrationListItem>
        <i18n-t
          scope="global"
          keypath="migration.renameAuto.modal.line6"
        >
          <CodeTag class="text-jade-500">
            [filename].cy.[ext]
          </CodeTag>
        </i18n-t>
      </MigrationListItem>
    </MigrationList>
    <Radio
      v-model:value="selectedValue"
      :options="options"
      name="skipRename"
      :label="t('migration.renameAuto.modal.label')"
    >
      <template #option="{ option, checked }">
        <span
          v-if="option.value === 'rename'"
          class="text-jade-500 leading-7"
        >
          <i18n-t
            scope="global"
            keypath="migration.renameAuto.modal.option1"
          >
            <CodeTag class="ml-0 text-jade-500">
              [filename].cy.[ext]
            </CodeTag>
          </i18n-t>
        </span>
        <span
          v-else
          class="text-gray-800 leading-7"
        >
          {{ props.hasCustomIntegrationFolder ? t('migration.renameAuto.modal.option2') : t('migration.renameAuto.modal.option3') }}
          <i18n-t
            v-if="checked"
            scope="global"
            keypath="migration.renameAuto.modal.optOutAdditional"
          >
            <CodeTag class="text-jade-500">
              specPattern
            </CodeTag>
          </i18n-t>
        </span>
      </template>
    </Radio>
    <template #footer>
      <div class="flex gap-[16px]">
        <Button
          @click="emit('save', selectedValue)"
        >
          {{ t('migration.renameAuto.modal.buttonSave') }}
        </Button>
        <Button
          variant="outline-light"
          @click="emit('cancel')"
        >
          {{ t('migration.renameAuto.modal.buttonCancel') }}
        </Button>
      </div>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Alert from '@cy/components/Alert.vue'
import Button from '@cypress-design/vue-button'
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

const selectedValue = ref<PossibleOption>('rename')

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
