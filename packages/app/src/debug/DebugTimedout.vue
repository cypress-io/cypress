<template>
  <Alert
    title="Incomplete"
    status="warning"
    :icon="ErrorOutlineIcon"
    class="flex flex-col mb-[24px] w-full"
  >
    The run started but never completed. This can happen when the run is cancelled from CI or when Cypress crashes while running tests.
    <span v-if="ci && hasCiInfo">
      Check your <ExternalLink :href="ci.url || '#'">
        {{ `${ci.formattedProvider} #${ci.ciBuildNumberFormatted}` }}
      </ExternalLink> logs for more information.
    </span>
    Archive this run to remove it from the runs list and analytics.
    <div class="mt-[20px]">
      {{ totalSkippedSpecs }} of {{ totalSpecs }} {{ totalSpecs === 1 ? 'spec' : 'specs' }} skipped
    </div>
  </Alert>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import Alert from '@cy/components/Alert.vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import type { DebugPageDetails_CloudCiBuildInfoFragment } from '../generated/graphql'

const props = defineProps<{
  ci?: DebugPageDetails_CloudCiBuildInfoFragment
  totalSpecs: number
  totalSkippedSpecs: number
}>()

const hasCiInfo = computed(() => {
  return !!(props.ci?.url && props.ci.formattedProvider && props.ci.ciBuildNumberFormatted)
})

</script>
