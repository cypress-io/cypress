<template>
  <DebugEmptyView
    :title="t('debugPage.emptyStates.gitRepositoryNotDetected')"
    :description="t('debugPage.emptyStates.ensureGitSetupCorrectly')"
    :icon="IconTechnologyCommandLineError"
  />
</template>

<script lang="ts" setup>
import DebugEmptyView from './DebugEmptyView.vue'
import { useI18n } from '@cy/i18n'
import { IconTechnologyCommandLineError } from '@cypress-design/vue-icon'

const { t } = useI18n()

</script>
