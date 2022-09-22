<template>
  <TrackedBanner
    :banner-id="bannerId"
    :model-value="modelValue"
    data-cy="record-banner"
    status="info"
    :title="t('specPage.banners.record.title')"
    class="mb-16px"
    :icon="RecordIcon"
    dismissible
    :has-banner-been-shown="hasBannerBeenShown"
    :event-data="{
      campaign: 'Record Runs',
      medium: 'Specs Record Runs Banner',
      cohort: 'n/a'
    }"
    @update:model-value="value => emit('update:modelValue', value)"
  >
    <RecordPrompt />
  </TrackedBanner>
</template>

<script setup lang="ts">
import RecordIcon from '~icons/cy/action-record_x16.svg'
import { useI18n } from '@cy/i18n'
import TrackedBanner from './TrackedBanner.vue'
import { BannerIds } from '@packages/types'
import RecordPrompt from '../../../../frontend-shared/src/gql-components/RecordPrompt.vue'

defineProps<{
  modelValue: boolean
  hasBannerBeenShown: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()
const bannerId = BannerIds.ACI_082022_RECORD

</script>
