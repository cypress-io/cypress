<template>
  <StandardModal
    class="transition transition-all duration-200"
    variant="bare"
    :title="t('specPage.banners.record.title')"
    :model-value="isModalOpen"
    :help-link="helpLink"
    :no-help="!helpLink"
    data-cy="record-run-modal"
    @update:model-value="close"
  >
    <div class="max-w-175 py-7 px-6 text-gray-600">
      <p class="mb-24px">
        {{ t('specPage.banners.record.content') }}
      </p>
      <RecordPromptAdapter />
    </div>
  </StandardModal>
</template>

<script setup lang="ts" >
import { useI18n } from '@cy/i18n'
import StandardModal from '../components/StandardModal.vue'
import RecordPromptAdapter from './RecordPromptAdapter.vue'
import { getUtmSource } from '../utils/getUtmSource'
import { getUrlWithParams } from '../utils/getUrlWithParams'

const { t } = useI18n()

const props = defineProps<{
  isModalOpen: boolean
  close: () => void
  utmMedium: string
  utmContent?: string
}>()

const helpLink = getUrlWithParams({
  url: 'https://on.cypress.io/cypress-run-record-key',
  params: {
    utm_medium: props.utmMedium,
    utm_source: getUtmSource(),
    utm_content: props.utmContent || '',
  },
})

</script>
