<template>
  <div
    id="limit-row"
    data-cy="debug-spec-limit"
    class="w-full"
  >
    <ul class="border rounded flex flex-row flex-wrap bg-indigo-50 border-indigo-100 p-4 gap-x-2 items-center whitespace-nowrap children:flex children:items-center">
      <li class="font-medium text-sm text-gray-900">
        Cypress renders up to 100 failed test results
      </li>
      <li class="font-normal text-sm text-gray-700">
        This run has {{ failedTestCount }} failed {{ failedTestCount === 1 ? 'test' : 'tests' }}
      </li>
      <li
        v-if="cloudRunUrlWithUtmParams"
        class="text-sm"
      >
        <ExternalLink :href="cloudRunUrlWithUtmParams">
          See all test results in Cypress Cloud
        </ExternalLink>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { computed } from 'vue'
import { DEBUG_TAB_MEDIUM } from './utils/constants'

const props = defineProps<{
  failedTestCount: number
  cloudRunUrl: string | null
}>()

const cloudRunUrlWithUtmParams = computed(() => props.cloudRunUrl && getUrlWithParams({ url: props.cloudRunUrl, params: { utm_medium: DEBUG_TAB_MEDIUM, utm_campaign: 'Spec Limit' } }))

</script>

<style scoped>
#limit-row li:not(:first-child)::before {
  content: '•';
  @apply text-lg text-gray-500 pr-[8px] leading-5
}
</style>
