<template>
  <div
    id="limit-row"
    data-cy="debug-spec-limit"
    class="w-full"
  >
    <ul class="border rounded flex flex-row flex-wrap bg-indigo-50 border-indigo-100 p-4 gap-x-2 items-center whitespace-nowrap children:flex children:items-center">
      <li class="font-medium text-sm text-gray-900">
        {{ t('debugPage.limit.title') }}
      </li>
      <li class="font-normal text-sm text-gray-700">
        {{ t('debugPage.limit.message', { n: failedTestCount }) }}
      </li>
      <li
        v-if="cloudRunUrlWithUtmParams"
        class="text-sm"
      >
        <ExternalLink :href="cloudRunUrlWithUtmParams">
          {{ t('debugPage.limit.link') }}
        </ExternalLink>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { useI18n } from '@cy/i18n'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { computed } from 'vue'
import { DEBUG_TAB_MEDIUM } from './utils/constants'

const { t } = useI18n()

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
