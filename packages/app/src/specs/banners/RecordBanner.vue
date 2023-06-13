<template>
  <TrackedBanner
    :banner-id="bannerId"
    data-cy="record-banner"
    status="info"
    :title="t('specPage.banners.record.title')"
    class="mb-[16px]"
    :icon="RecordIcon"
    dismissible
    :has-banner-been-shown="hasBannerBeenShown"
    :event-data="{
      campaign: 'Record Runs',
      medium: 'Specs Record Runs Banner',
      cohort: 'n/a'
    }"
  >
    <p class="mb-[24px]">
      {{ t('specPage.banners.record.content') }}
    </p>
    <RecordPromptAdapter />
  </TrackedBanner>
</template>

<script setup lang="ts">
import RecordIcon from '~icons/cy/action-record_x16.svg'
import { useI18n } from '@cy/i18n'
import TrackedBanner from './TrackedBanner.vue'
import { BannerIds } from '@packages/types'
import RecordPromptAdapter from '@packages/frontend-shared/src/gql-components/RecordPromptAdapter.vue'

defineProps<{
  hasBannerBeenShown: boolean
}>()

const { t } = useI18n()
const bannerId = BannerIds.ACI_082022_RECORD

</script>
