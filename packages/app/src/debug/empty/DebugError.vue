<template>
  <div class="m-[25px]">
    <Alert
      data-cy="debug-alert"
      status="warning"
      :title="t('debugPage.emptyStates.gitRepositoryNotDetected')"
      :icon="WarningIcon"
      dismissible
    >
      <p>{{ t('debugPage.emptyStates.ensureGitSetupCorrectly') }}</p>
    </Alert>
  </div>
  <DebugEmptyView
    :title="t('debugPage.emptyStates.debugDirectlyInCypress')"
    :description="t('debugPage.emptyStates.reviewRerunAndDebug')"
    :help-link-sr-text="t('debugPage.emptyStates.learnAboutDebuggingSrText')"
    help-link-href="https://on.cypress.io/debug-page"
  />
</template>

<script lang="ts" setup>
import DebugEmptyView from './DebugEmptyView.vue'
import Alert from '@packages/frontend-shared/src/components/Alert.vue'
import WarningIcon from '~icons/cy/warning_x16.svg'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

</script>
