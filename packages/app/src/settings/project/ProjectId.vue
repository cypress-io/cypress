<template>
  <SettingsSection
    code="projectId"
    data-cy="settings-projectId"
  >
    <template #title>
      {{ t('settingsPage.projectId.title') }}
    </template>
    <template #description>
      <i18n-t keypath="settingsPage.projectId.description">
        <ExternalLink
          href="https://docs.cypress.io"
        >
          {{ t('links.learnMore') }}
        </ExternalLink>
      </i18n-t>
    </template>
    <div class="flex items-center gap-10px">
      <CodeBox
        :code="props.gql?.projectId || ''"
        :prefix-icon="IconOctothorpe"
      />
      <CopyButton
        v-if="props.gql?.projectId"
        :text="props.gql?.projectId"
        variant="outline"
      />
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import CopyButton from '@cy/components/CopyButton.vue'
import { useI18n } from '@cy/i18n'
import IconOctothorpe from '~icons/cy/octothorpe_x16.svg'
import SettingsSection from '../SettingsSection.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import CodeBox from './CodeBox.vue'
import type { ProjectIdFragment } from '../../generated/graphql'

gql`
fragment ProjectId on Project {
  projectId
}
`

const props = defineProps<{
  gql?: ProjectIdFragment
}>()

const { t } = useI18n()
</script>
