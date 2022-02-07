<template>
  <StandardModal
    :model-value="true"
    :title="t('migration.renameAuto.modals.title')"
  >
    <Alert
      status="warning"
      :title="t('migration.renameAuto.modals.step2.warning')"
      :icon="WarningIcon"
      icon-classes="icon-dark-orange-400"
    />
    <Radio
      v-model:value="value"
      :options="[{label: '',value: 'rename'},{label: '', value: 'skip'}]"
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
          {{ t('migration.renameAuto.modals.step2.option2') }}
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
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const emit = defineEmits([
  'save',
  'cancel',
])

const value = ref('rename')

</script>
