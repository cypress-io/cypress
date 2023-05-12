<template>
  <DebugEmptyView
    :title="t('debugPage.emptyStates.gitRepositoryNotDetected')"
    :description="t('debugPage.emptyStates.ensureGitSetupCorrectly')"
  />
</template>

<script lang="ts" setup>
import DebugEmptyView from './DebugEmptyView.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

</script>
