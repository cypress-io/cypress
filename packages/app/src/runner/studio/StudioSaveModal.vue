<template>
  <StandardModal
    :model-value="props.open"
    :no-help="true"
    variant="bare"
    data-cy="studio-save-modal"
    @update:model-value="emit('close')"
  >
    <template #title>
      {{ t('runner.studio.saveTest') }}
    </template>

    <div class="max-w-sm px-5 py-5 w-sm">
      <form
        class="flex items-center justify-evenly"
        @submit="submit"
      >
        <div class="w-full">
          <Input
            id="testName"
            v-model="testName"
            class="rounded-md"
            :placeholder="t('runner.studio.testName')"
            type="text"
            :required="true"
          />
        </div>
        <div class="ml-3">
          <button
            class="disabled:opacity-50 disabled:pointer-events-none"
            type="submit"
            :disabled="!testName"
          >
            <div class="rounded-md flex bg-indigo-500 py-1.5 px-1 align-center hover:bg-indigo-400">
              <div class="pt-1 ml-2">
                <i-cy-circle-check_x16 class="fill-gray-200 stroke-gray-1000" />
              </div>
              <div class="mx-2 font-medium text-white">
                {{ t('runner.studio.saveTestButton') }}
              </div>
            </div>
          </button>
        </div>
      </form>
    </div>
  </StandardModal>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import StandardModal from '@packages/frontend-shared/src/components/StandardModal.vue'
import { ref } from 'vue'
import Input from '@packages/frontend-shared/src/components/Input.vue'
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
