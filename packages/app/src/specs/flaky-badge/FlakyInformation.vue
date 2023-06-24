<template>
  <Tooltip
    v-if="isFlaky"
    placement="top"
    :is-interactive="true"
    class="h-[16px]"
    :hide-delay="0"
    :distance="10"
    style="width: fit-content"
  >
    <ExternalLink
      :href="cloudUrl"
      class="hocus:no-underline"
    >
      <FlakyBadge />
    </ExternalLink>
    <template #popper="{ shown }">
      <ExternalLink
        v-if="shown && props.projectGql?.projectId && props.specGql?.relative"
        :href="cloudUrl"
        class="hocus:no-underline"
      >
        <FlakySpecSummary
          :spec-name="props.specGql?.fileName ?? ''"
          :spec-extension="props.specGql?.specFileExtension ?? ''"
          :severity="flakyStatus?.severity ?? 'NONE'"
          :total-runs="flakyStatus?.flakyRunsWindow ?? 0"
          :total-flaky-runs="flakyStatus?.flakyRuns ?? 0"
          :runs-since-last-flake="flakyStatus?.lastFlaky ?? 0"
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
import FlakyBadge from './FlakyBadge.vue'
import FlakySpecSummary from './FlakySpecSummary.vue'
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
  specFileExtension
}
`

gql`
fragment FlakyInformationCloudSpec on RemoteFetchableCloudProjectSpecResult {
  id
  data {
    ... on CloudProjectSpec {
      id
      isConsideredFlakyForRunIds(cloudRunIds: $runIds)
      flakyStatusForRunIds(cloudRunIds: $runIds) {
        __typename
        ... on CloudProjectSpecFlakyStatus {
          dashboardUrl
          severity
          flakyRuns
          flakyRunsWindow
          lastFlaky
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

const cloudSpec = computed(() => props.cloudSpecGql?.data?.__typename === 'CloudProjectSpec' ? props.cloudSpecGql.data : null)
const isFlaky = computed(() => !!cloudSpec.value?.isConsideredFlakyForRunIds)
const flakyStatus = computed(() => cloudSpec.value?.flakyStatusForRunIds?.__typename === 'CloudProjectSpecFlakyStatus' ? cloudSpec.value?.flakyStatusForRunIds : null)
const cloudUrl = computed(() => {
  return getUrlWithParams({
    url: flakyStatus.value?.dashboardUrl || '#',
    params: {
      utm_medium: 'Specs Flake Annotation Badge',
      utm_campaign: 'Flaky',
    },
  })
})

</script>
