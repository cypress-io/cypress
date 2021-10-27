<template>
  <SettingsSection>
    <template #title>
      {{ t('settingsPage.projectId.title') }}
    </template>
    <template #description>
      <i18n-t keypath="settingsPage.projectId.description">
        <a
          href="https://docs.cypress.io"
          target="_blank"
        >{{ t('links.learnMore') }}</a>
      </i18n-t>
    </template>
    <div class="flex items-center gap-10px">
      <div class="bg-gray-50 flex items-center w-256px h-34px pr-16px border rounded border-gray-100 text-jade-500">
        <i-cy-octothorpe_x16 class="h-16px w-16px icon-dark-gray-500 mx-8px" />
        <code>{{ props.gql?.projectId }}</code>
      </div>
      <CopyButton
        :text="props.gql?.projectId || ''"
        variant="outline"
      />
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import CopyButton from '@cy/components/CopyButton.vue'
import { useI18n } from '@cy/i18n'
import SettingsSection from '../SettingsSection.vue'
import type { ProjectIdFragment } from '../../generated/graphql'

gql`
fragment ProjectId on Project {
  projectId
}
`

const props = defineProps<{
  mockClipboard?: any,
  gql?: ProjectIdFragment
}>()

const { t } = useI18n()
</script>
