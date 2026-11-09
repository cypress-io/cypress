<template>
  <SettingsSection
    code="projectId"
    data-cy="settings-projectId"
  >
    <template #title>
      Project ID
    </template>
    <template #description>
      The Project ID configured for this project inside of Cypress Cloud.
      <ExternalLink
        :href="learnMoreUrl"
      >
        Learn more.
      </ExternalLink>
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
import CopyButton from '@cy/gql-components/CopyButton.vue'
import IconOctothorpe from '~icons/cy/octothorpe_x16.svg'
import SettingsSection from '../SettingsSection.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import CodeBox from './CodeBox.vue'
import type { ProjectIdFragment } from '../../generated/graphql'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'

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

const learnMoreUrl = getUrlWithParams({ url: 'https://on.cypress.io/what-is-a-project-id', params: { utm_medium: 'Settings', utm_campaign: 'Project ID' } })

</script>
