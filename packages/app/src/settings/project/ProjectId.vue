<template>
  <SettingsSection
    code="projectId"
    data-cy="settings-projectId"
  >
    <template #title>
      {{ t('settingsPage.projectId.title') }}
    </template>
    <template #description>
      <i18n-t
        scope="global"
        keypath="settingsPage.projectId.description"
      >
        <ExternalLink
          href="https://on.cypress.io/what-is-a-project-id"
        >
          {{ t('links.learnMore') }}
        </ExternalLink>
      </i18n-t>
    </template>
    <div
      v-if="props.gql.currentProject?.projectId"
      class="flex gap-[10px] items-center"
    >
      <CodeBox
        :code="props.gql.currentProject?.projectId"
        :prefix-icon="IconOctothorpe"
      />
      <CopyButton
        :text="props.gql.currentProject?.projectId"
        variant="outline"
      />
    </div>
  </SettingsSection>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { useI18n } from '@cy/i18n'
import CopyButton from '@cy/gql-components/CopyButton.vue'
import IconOctothorpe from '~icons/cy/octothorpe_x16.svg'
import SettingsSection from '../SettingsSection.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import CodeBox from './CodeBox.vue'
import type { ProjectIdFragment } from '../../generated/graphql'

const { t } = useI18n()

gql`
fragment ProjectId on Query {
  currentProject {
    id
    projectId
  }
}`

const props = defineProps<{
  gql: ProjectIdFragment
}>()

</script>
