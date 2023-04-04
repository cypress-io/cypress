<template>
  <DebugEmptyView
    :title="t('debugPage.emptyStates.recordYourFirstRun')"
    :description="t('debugPage.emptyStates.almostThere')"
    :example-test-name="t('debugPage.emptyStates.noRunsTestMessage')"
    :slideshow-campaign="DEBUG_SLIDESHOW.campaigns.recordRun"
    :help-link-sr-text="t('debugPage.emptyStates.learnAboutRecordingSrText')"
    help-link-href="https://on.cypress.io/cypress-run-record-key"
  >
    <template #cta>
      <RecordPromptAdapter class="w-[80%]" />
    </template>
  </DebugEmptyView>
</template>

<script lang="ts" setup>
import DebugEmptyView from './DebugEmptyView.vue'
import { useI18n } from '@cy/i18n'
import RecordPromptAdapter from '@cy/gql-components/RecordPromptAdapter.vue'
import { DEBUG_SLIDESHOW } from '../utils/constants'

const { t } = useI18n()

</script>
