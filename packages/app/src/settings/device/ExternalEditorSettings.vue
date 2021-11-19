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
import type { ExternalEditorSettingsFragment } from '../../generated/graphql'
import { ExternalEditorSettings_SetPreferredEditorBinaryDocument } from '@packages/data-context/src/gen/all-operations.gen'
import { useMutation } from '@urql/vue'

gql`
mutation ExternalEditorSettings_SetPreferredEditorBinary ($value: String!) {
  setPreferredEditorBinary (value: $value)
}`

const { t } = useI18n()

const setPreferredBinaryEditor = useMutation(ExternalEditorSettings_SetPreferredEditorBinaryDocument)

function handleChoseEditor (binary: string) {
  setPreferredBinaryEditor.executeMutation({ value: binary })
}

gql`
fragment ExternalEditorSettings on Query {
  ...ChooseExternalEditor
}`

const props = defineProps<{
  gql: ExternalEditorSettingsFragment
}>()
</script>
