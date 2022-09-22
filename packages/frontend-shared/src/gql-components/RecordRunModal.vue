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
      <RecordPrompt />
    </div>
  </StandardModal>
</template>

<script setup lang="ts" >
import { useI18n } from '@cy/i18n'
import StandardModal from '../components/StandardModal.vue'
import RecordPrompt from './RecordPrompt.vue'
import { getUtmSource } from '../utils/getUtmSource'

const { t } = useI18n()

const props = defineProps<{
  isModalOpen: boolean
  close: () => void
  utmMedium: string
  utmContent?: string
}>()

const helpLink =
`https://on.cypress.io/cypress-run-record-key?utm_medium="${props.utmMedium}",utm_source="${getUtmSource()}"${props.utmContent ? `,utm_content="${props.utmContent}"` : ''}`

</script>
