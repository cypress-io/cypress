<template>
  <TrackedBanner
    :banner-id="bannerId"
    data-cy="record-banner"
    status="info"
    title="Record your first run"
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
      Record a run to see your test results in Cypress Cloud. You can then optimize your test suite, debug failing and flaky tests, and integrate with your favorite tools.
    </p>
    <RecordPromptAdapter />
  </TrackedBanner>
</template>

<script setup lang="ts">
import RecordIcon from '~icons/cy/action-record_x16.svg'
import TrackedBanner from './TrackedBanner.vue'
import { BannerIds } from '@packages/types'
import RecordPromptAdapter from '@packages/frontend-shared/src/gql-components/RecordPromptAdapter.vue'

defineProps<{
  hasBannerBeenShown: boolean
}>()

const bannerId = BannerIds.ACI_082022_RECORD

</script>
