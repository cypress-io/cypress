<template>
  <DebugEmptyView
    :title="t('debugPage.emptyStates.noRunsFoundForBranch')"
    :description="t('debugPage.emptyStates.noRunsForBranchMessage')"
    :icon="IconTechnologyCommandLineError"
    :utm="utm"
    help-link-href="https://on.cypress.io/git-info"
  />
</template>

<script lang="ts" setup>
import DebugEmptyView from './DebugEmptyView.vue'
import { useI18n } from '@cy/i18n'
import { IconTechnologyCommandLineError } from '@cypress-design/vue-icon'

const { t } = useI18n()

const utm = {
  utm_campaign: 'No Runs Found',
}

</script>
