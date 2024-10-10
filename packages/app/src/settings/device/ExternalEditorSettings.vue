<template>
  <SettingsSection
    label-id="choose-editor-label"
  >
    <template
      #title
    >
      {{ t('settingsPage.editor.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.editor.description') }}
    </template>

    <ChooseExternalEditor
      v-if="props.gql.localSettings"
      :gql="props.gql"
      label-id="choose-editor-label"
      @chose-editor="handleChoseEditor"
    />
  </SettingsSection>
</template>

<script lang="ts" setup>
import SettingsSection from '../SettingsSection.vue'
import ChooseExternalEditor from '@packages/frontend-shared/src/gql-components/ChooseExternalEditor.vue'
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/core'
import { ExternalEditorSettings_SetPreferredEditorBinaryDocument } from '../../generated/graphql'
import type { ExternalEditorSettingsFragment } from '../../generated/graphql'
import { useMutation } from '@urql/vue'

gql`
mutation ExternalEditorSettings_SetPreferredEditorBinary ($value: String!) {
  setPreferences (value: $value, type: global) {
    ...ExternalEditorSettings
  }
}`

const { t } = useI18n()

const setPreferredBinaryEditor = useMutation(ExternalEditorSettings_SetPreferredEditorBinaryDocument)

function handleChoseEditor (binary: string | null) {
  setPreferredBinaryEditor.executeMutation({ value: JSON.stringify({ preferredEditorBinary: binary }) })
}

gql`
fragment ExternalEditorSettings on Query {
  ...ChooseExternalEditor
}`

const props = defineProps<{
  gql: ExternalEditorSettingsFragment
}>()
</script>
