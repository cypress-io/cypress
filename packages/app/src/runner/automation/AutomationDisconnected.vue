<template>
  <AutInfo>
    <Alert
      :title="t('runner.automation.disconnected.title')"
      status="warning"
      :icon="ErrorOutlineIcon"
      :dismissible="false"
      class="w-full max-w-[600px]"
    >
      <div class="flex flex-col gap-[16px]">
        <p>
          {{ t('runner.automation.disconnected.description') }}
        </p>
        <Button
          size="md"
          :prefix-icon="RefreshIcon"
          prefix-icon-class="icon-dark-white"
          @click="relaunch"
        >
          {{ t('runner.automation.disconnected.reload') }}
        </Button>
        <ExternalLink
          class="mt-[16px] text-indigo-500"
          href="https://on.cypress.io/launching-browsers"
        >
          <i-cy-book_x16 class="ml-[8px] -top-[2px] relative inline-block icon-dark-indigo-500 icon-light-indigo-100" />
          {{ t('runner.automation.shared.link') }}
        </ExternalLink>
      </div>
    </Alert>
  </AutInfo>
</template>

<script setup lang="ts">
import AutInfo from './AutInfo.vue'
import Button from '@cy/components/Button.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import RefreshIcon from '~icons/cy/refresh_x16'
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import { AutomationDisconnected_RelaunchBrowserDocument } from '../../generated/graphql'
import { useI18n } from '@cy/i18n'
import Alert from '@cy/components/Alert.vue'
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'

const { t } = useI18n()

gql`
mutation AutomationDisconnected_RelaunchBrowser {
  launchOpenProject {
    id
  }
}
`

const gqlRelaunch = useMutation(AutomationDisconnected_RelaunchBrowserDocument)

const relaunch = () => gqlRelaunch.executeMutation({})

</script>
