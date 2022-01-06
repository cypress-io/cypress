<template>
  <div
    v-if="recordKey"
    class="mb-16px gap-10px inline-flex justify-start"
  >
    <CodeBox
      :code="recordKey"
      :prefix-icon="IconKey"
      :title="t('settingsPage.recordKey.title')"
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
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from '@cy/i18n'
import type { RecordKeyFragment } from '../../generated/graphql'
import Button from '@cy/components/Button.vue'
import IconKey from '~icons/cy/security-key_x16.svg'
import IconExport from '~icons/cy/export_x16.svg'
import { gql } from '@urql/core'
import CopyButton from '@cy/components/CopyButton.vue'
import CodeBox from './CodeBox.vue'
import { useExternalLink } from '@cy/gql-components/useExternalLink'

gql`
fragment RecordKey on CloudRecordKey {
  id
  key
}
`

const props = defineProps<{
  gql: RecordKeyFragment
  settingsUrl: string
}>()

const openManageKeys = useExternalLink(props.settingsUrl)
const { t } = useI18n()

const recordKey = computed(() => props.gql.key)
</script>
