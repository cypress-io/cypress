<template>
  <SettingsSection
    data-cy="settings-recordKey"
  >
    <template #title>
      {{ t('settingsPage.recordKey.title') }}
    </template>
    <template #description>
      <i18n-t
        scope="global"
        keypath="settingsPage.recordKey.description"
      >
        <ExternalLink
          href="https://on.cypress.io/what-is-a-record-key"
        >
          {{ t('links.learnMore') }}
        </ExternalLink>
      </i18n-t>
    </template>
    <div
      v-if="recordKey"
      class="gap-[10px] inline-flex justify-start"
    >
      <CodeBox
        :code="recordKey"
        :prefix-icon="IconTerminal"
        confidential
      />
      <CopyButton
        :text="recordKey"
        variant="outline"
      />
      <Button
        variant="outline"
        :prefix-icon="IconExport"
        prefix-icon-class="icon-dark-gray-500"
        @click="openManageKeys"
      >
        {{ t('settingsPage.recordKey.manageKeys') }}
      </Button>
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/core'
import Button from '@cy/components/Button.vue'
import CopyButton from '@cy/gql-components/CopyButton.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { useExternalLink } from '@cy/gql-components/useExternalLink'
import IconTerminal from '~icons/cy/terminal_x16.svg'
import IconExport from '~icons/cy/export_x16.svg'
import type { RecordKeyFragment } from '../../generated/graphql'
import SettingsSection from '../SettingsSection.vue'
import CodeBox from './CodeBox.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment RecordKey on CloudRecordKey {
  id
  key
}
`

const props = defineProps<{
  gql: RecordKeyFragment
  manageKeysUrl: string
}>()

const openManageKeys = useExternalLink(props.manageKeysUrl)

const recordKey = computed(() => props.gql.key)
</script>
