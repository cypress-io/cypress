<template>
  <SettingsSection
    data-cy="settings-recordKey"
    anchor-id="recordKey"
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
      class="inline-flex justify-start gap-10px"
    >
      <CodeBox
        :code="recordKey"
        :prefix-icon="IconKey"
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
import { computed, ref } from 'vue'
import { useI18n } from '@cy/i18n'
import type { RecordKeyFragment } from '../../generated/graphql'
import SettingsSection from '../SettingsSection.vue'
import Button from '@cy/components/Button.vue'
import IconKey from '~icons/cy/placeholder_x16.svg'
import IconExport from '~icons/cy/export_x16.svg'
import { gql } from '@urql/core'
import CopyButton from '@cy/components/CopyButton.vue'
import CodeBox from './CodeBox.vue'
import ExternalLink from '@packages/frontend-shared/src/gql-components/ExternalLink.vue'

gql`
fragment RecordKey on CloudRecordKey {
  id
  key
}
`

const props = defineProps<{
  gql: RecordKeyFragment
}>()

const openManageKeys = () => { }
const showRecordKey = ref(false)
const { t } = useI18n()

const recordKey = computed(() => props.gql.key)
</script>
