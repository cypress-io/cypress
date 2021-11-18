<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.editor.title') }}
    </template>
    <template #description>
      {{ t('settingsPage.editor.description') }}
    </template>

    <ChooseExternalEditor :gql="props.gql" />
  </SettingsSection>
</template>

<script lang="ts" setup>
import SettingsSection from '../SettingsSection.vue'
import ChooseExternalEditor from '@packages/frontend-shared/src/gql-components/ChooseExternalEditor.vue'
import { useI18n } from '@cy/i18n'
import { gql } from '@urql/core'
import type { ExternalEditorSettingsFragment } from '../../generated/graphql'

const { t } = useI18n()

gql`
fragment ExternalEditorSettings on Query {
  ...ChooseExternalEditor
}`

const props = defineProps<{
  gql: ExternalEditorSettingsFragment
}>()
</script>
