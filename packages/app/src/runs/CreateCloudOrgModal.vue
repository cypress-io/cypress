<template>
  <StandardModal
    :title="t('runs.connect.modal.title')"
    :model-value="show"
  >
    <div class="w-592px rounded border border-dashed border-gray-100 p-24px ">
      <p class="text-gray-700 text-center">
        {{ t('runs.connect.modal.createOrg.description') }}
      </p>
      <Button
        size="lg"
        class="mx-auto mt-16px"
        :prefix-icon="OrganizationIcon"
        prefix-icon-class="icon-light-transparent icon-dark-white"
      >
        {{ t('runs.connect.modal.createOrg.button') }}
      </Button>
    </div>
    <template #footer>
      <div class="flex gap-16px">
        <Button
          size="lg"
          variant="pending"
        >
          <template #prefix>
            <i-cy-loading_x16
              class="animate-spin icon-dark-white icon-light-gray-400"
            />
          </template>
          {{ t('runs.connect.modal.createOrg.waitingButton') }}
        </Button>
        <Button
          variant="outline"
          size="lg"
          @click="() => emit('cancel')"
        >
          {{ t('runs.connect.modal.cancel') }}
        </Button>
      </div>
    </template>
  </StandardModal>
</template>

<script lang="ts" setup>
import StandardModal from '@cy/components/StandardModal.vue'
import Button from '@cy/components/Button.vue'
import OrganizationIcon from '~icons/cy/office-building_x16.svg'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
}>()
</script>
