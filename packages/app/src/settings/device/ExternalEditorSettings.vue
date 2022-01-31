<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.editor.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.editor.description') }}
    </template>

    <ChooseExternalEditor
      v-if="props.gql.localSettings"
      :gql="props.gql"
      @chose-editor="handleChoseEditor"
    />
  </SettingsSection>
</template>

<script lang="ts" setup>
import SettingsSection from '../SettingsSection.vue'
import ChooseExternalEditor from '@packages/frontend-shared/src/gql-components/ChooseExternalEditor.vue'
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/core'
import { ExternalEditorSettingsFragment, ExternalEditorSettings_SetPreferredEditorBinaryDocument } from '../../generated/graphql'
import { useMutation } from '@urql/vue'

gql`
mutation ExternalEditorSettings_SetPreferredEditorBinary ($value: String!) {
  setPreferences (value: $value) {
    ...ExternalEditorSettings
  }
}`

const { t } = useI18n()

const setPreferredBinaryEditor = useMutation(ExternalEditorSettings_SetPreferredEditorBinaryDocument)

function handleChoseEditor (binary: string) {
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
