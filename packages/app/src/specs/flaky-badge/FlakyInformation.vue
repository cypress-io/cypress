<template>
  <Tooltip
    v-if="isFlaky"
    placement="top"
    :is-interactive="true"
    class="h-16px"
    :hide-delay="0"
    :distance="10"
    style="width: fit-content"
  >
    <ExternalLink
      :href="dashboardUrl"
      class="hocus:no-underline"
    >
      <FlakyBadge />
    </ExternalLink>
    <template #popper="{ shown }">
      <ExternalLink
        v-if="shown && projectId && specPath"
        :href="dashboardUrl"
        class="hocus:no-underline"
      >
        <FlakySpecSummaryAdapter
          :project-id="projectId"
          :from-branch="fromBranch"
          :spec-path="specPath"
          :spec-name="specName"
          :spec-extension="specExtension"
        />
      </ExternalLink>
    </template>
  </Tooltip>
</template>

<script setup lang="ts">

import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { FlakyInformationProjectFragment, FlakyInformationSpecFragment, FlakyInformationCloudSpecFragment } from '../../generated/graphql'
import { gql } from '@urql/vue'
import { computed } from 'vue'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'
import FlakySpecSummaryAdapter from './FlakySpecSummaryAdapter.vue'
import FlakyBadge from './FlakyBadge.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'

gql`
fragment FlakyInformationProject on CurrentProject {
  id
  projectId
  branch
}
`

gql`
fragment FlakyInformationSpec on Spec {
  id
  relative
  fileName
  fileExtension
}
`

gql`
fragment FlakyInformationCloudSpec on RemoteFetchableCloudProjectSpecResult {
  id
  data {
    ... on CloudProjectSpec {
      id
      isConsideredFlaky(fromBranch: $fromBranch)
      flakyStatus(fromBranch: $fromBranch, flakyRunsWindow: 50) {
        __typename
        ... on CloudProjectSpecFlakyStatus {
          dashboardUrl
        }
      }
    }
  }
}
`

const props = defineProps<{
  projectGql: FlakyInformationProjectFragment | null | undefined
  specGql: FlakyInformationSpecFragment | null | undefined
  cloudSpecGql: FlakyInformationCloudSpecFragment | null | undefined
}>()

const isFlaky = computed(() => props.cloudSpecGql?.data?.__typename === 'CloudProjectSpec' && !!props.cloudSpecGql?.data?.isConsideredFlaky)
const dashboardUrl = computed(() => {
  const cloudSpec = props.cloudSpecGql?.data?.__typename === 'CloudProjectSpec' ? props.cloudSpecGql.data : null
  const flakyStatus = cloudSpec?.flakyStatus?.__typename === 'CloudProjectSpecFlakyStatus' ? cloudSpec.flakyStatus : null

  return getUrlWithParams({
    url: flakyStatus?.dashboardUrl || '#',
    params: {
      utm_medium: 'Specs Flake Annotation Badge',
      utm_campaign: 'Flaky',
    },
  })
})

const projectId = computed(() => props.projectGql?.projectId)
const fromBranch = computed(() => props.projectGql?.branch ?? '')
const specPath = computed(() => props.specGql?.relative)
const specName = computed(() => props.specGql?.fileName ?? '')
const specExtension = computed(() => props.specGql?.fileExtension ?? '')

</script>
