<template>
  <ExternalLink
    v-if="isFlaky"
    :href="props.dashboardUrl"
    class="font-bold bg-orange-50 rounded-4px text-xs px-4px text-orange-600 items-center uppercase hocus:no-underline"
    style="width: fit-content"
    data-cy="flaky-badge"
  >
    {{ t('specPage.flaky.badgeLabel') }}
  </ExternalLink>
</template>

<script setup lang="ts">

import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { FlakyBadgeFragment } from '../../generated/graphql'
import { gql } from '@urql/vue'
import { computed } from 'vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment FlakyBadge on RemoteFetchableCloudProjectSpecResult {
  id
  data {
    ... on CloudProjectSpec {
      id
      retrievedAt
      isConsideredFlaky(fromBranch: $fromBranch)
    }
  }
}
`

const props = defineProps<{
  gql: FlakyBadgeFragment | null
  dashboardUrl: string
}>()

const isFlaky = computed(() => props.gql?.data?.__typename === 'CloudProjectSpec' && props.gql?.data?.isConsideredFlaky)

</script>
