<template>
  <StandardModal
    :model-value="props.open"
    variant="bare"
    data-cy="studio-save-modal"
    @update:model-value="emit('close')"
  >
    <template #title>
      <i className="fas fa-magic icon" />
      {{ t('runner.studio.saveNewTest') }}
    </template>

    <div className="content">
      <form
        @submit="submit"
      >
        <div className="text">
          <label
            className="text-strong"
            htmlFor="testName"
          >{{ t('runner.studio.testName') }}</label>
          <Input
            id="testName"
            v-model="testName"
            type="text"
            :required="true"
          />
        </div>
        <div className="center">
          <input
            type="submit"
            :value="t('runner.studio.saveTestButton')"
            class="btn btn-block"
            :disabled="!testName"
          >
        </div>
      </form>
    </div>
  </StandardModal>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import StandardModal from '@packages/frontend-shared/src/components/StandardModal.vue'
import { ref } from 'vue'
import Input from '../../../../frontend-shared/src/components/Input.vue'
import { useStudioStore } from '../../store/studio-store'

const { t } = useI18n()
const studioStore = useStudioStore()

const testName = ref('')

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function submit (e) {
  e.preventDefault()

  studioStore.save(testName.value)
}

</script>
