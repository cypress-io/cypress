<template>
  <div class="flex text-sm p-4 align-center">
    <div class="mr-2 pt-[2px]">
      <IconWarningCircle
        stroke-color="gray-500"
        fill-color="gray-50"
      />
    </div>
    <div class="text-gray-700">
      We found more than 100 runs.
      <ExternalLink
        v-if="cloudProjectUrlWithUtmParams"
        :href="cloudProjectUrlWithUtmParams"
      >
        Go to Cypress Cloud to see all runs
      </ExternalLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { IconWarningCircle } from '@cypress-design/vue-icon'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { DEBUG_TAB_MEDIUM } from './utils/constants'

const props = defineProps<{ cloudProjectUrl?: string }>()

const cloudProjectUrlWithUtmParams = computed(() => props.cloudProjectUrl && getUrlWithParams({ url: props.cloudProjectUrl, params: { utm_medium: DEBUG_TAB_MEDIUM, utm_campaign: 'Run Navigation Limit' } }))

</script>
